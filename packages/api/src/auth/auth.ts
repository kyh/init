import type { User } from "better-auth";
import { cache } from "react";
import { headers } from "next/headers";
import { expo } from "@better-auth/expo";
import { stripe } from "@better-auth/stripe";
import { and, eq, isNull } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { session as sessionSchema, user as userSchema } from "@repo/db/drizzle-schema-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, oAuthProxy, organization } from "better-auth/plugins";
import Stripe from "stripe";

import { sendEmail } from "../email/send-email";
import { slugify } from "./utils";

// No network call until first use, so a placeholder key keeps local dev
// working without Stripe configured (checkout/portal will fail, list won't)
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder");

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_ENV === "preview"
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  baseURL: baseUrl,
  plugins: [
    oAuthProxy({
      currentURL: baseUrl,
      productionURL: process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : baseUrl,
    }),
    expo(),
    organization({
      sendInvitationEmail: async (data) => {
        await sendEmail({
          to: data.email,
          subject: `You've been invited to ${data.organization.name}`,
          text: `Accept the invitation: ${baseUrl}/auth/invitation/${data.id}`,
        });
      },
    }),
    admin(),
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
      // Lazy customer creation keeps signup independent of Stripe config
      createCustomerOnSignUp: false,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "pro",
            priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
          },
        ],
        // Subscriptions are org-scoped (referenceId = organization id);
        // only owners/admins may manage the org's billing
        authorizeReference: async ({ user, referenceId }) => {
          const membership = await db.query.member.findFirst({
            where: (member, { and, eq }) =>
              and(eq(member.organizationId, referenceId), eq(member.userId, user.id)),
          });
          return membership?.role === "owner" || membership?.role === "admin";
        },
      },
    }),
    nextCookies(),
  ],
  emailAndPassword: {
    enabled: true,
    // Uncomment to block email/password login until the address is verified
    // requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password: ${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        text: `Click the link to verify your email: ${url}`,
      });
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    },
  },
  trustedOrigins: ["expo://"],
  advanced: {
    defaultCookieAttributes: {
      // The extension popup iframes the web app; SameSite=Lax cookies are
      // stripped in that cross-site context. Chrome exempts extensions that
      // hold host_permissions for the site from third-party cookie blocking.
      sameSite: "none",
      secure: true,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await createDefaultOrganization(user);
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          return await setActiveOrganization(session);
        },
      },
    },
  },
});

export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"];

/**
 * Cached function to get the current user session
 * Uses React cache to avoid unnecessary re-fetching
 * @returns Promise<Session | null> - The current user session or null if not authenticated
 */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export const getOrganization = cache(
  async (query: {
    organizationId?: string | undefined;
    organizationSlug?: string | undefined;
    membersLimit?: string | number | undefined;
  }) =>
    auth.api.getFullOrganization({
      query,
      headers: await headers(),
    }),
);

/**
 * Creates a default personal organization for a new user
 * Generates a unique slug and creates the organization
 * If organization creation fails, the user is deleted to maintain data consistency
 * @param user - The user object for whom to create the organization
 * @throws Error if organization creation fails
 */
/**
 * Generates an available organization slug by checking for conflicts
 * Recursively adds numbers to the slug until a unique one is found
 * @param slug - The base slug to check
 * @param attempt - The current attempt number for uniqueness
 * @returns Promise<string> - A unique, available slug
 */
const generateAvailableSlug = async (slug: string, attempt = 0): Promise<string> => {
  const org = await db.query.organization.findFirst({
    where: (organization, { eq }) => eq(organization.slug, slug),
  });
  if (org) {
    return generateAvailableSlug(slug + `-${attempt + 1}`, attempt + 1);
  }
  return slug;
};

const createDefaultOrganization = async (user: User) => {
  const slug = await generateAvailableSlug(slugify(user.name));

  try {
    const createdOrganization = await auth.api.createOrganization({
      body: {
        userId: user.id,
        name: "Personal Organization",
        slug,
        metadata: {
          personal: true,
        },
      },
    });

    // The signup session is created before this hook finishes, so the
    // session.create.before hook found no membership — backfill it
    if (createdOrganization) {
      await db
        .update(sessionSchema)
        .set({ activeOrganizationId: createdOrganization.id })
        .where(and(eq(sessionSchema.userId, user.id), isNull(sessionSchema.activeOrganizationId)));
    }
  } catch (err) {
    // If organization creation fails, delete the user to maintain data consistency
    await db.delete(userSchema).where(eq(userSchema.id, user.id));
    throw err;
  }
};

/**
 * Sets the active organization for a user session
 * Finds the first organization the user is a member of and sets it as active
 * @param session - The session object containing the user ID
 * @returns Promise<object> - Session data with activeOrganizationId set
 */
const setActiveOrganization = async (session: { userId: string }) => {
  const firstOrg = await db.query.member.findFirst({
    where: (member, { eq }) => eq(member.userId, session.userId),
  });

  return {
    data: {
      ...session,
      activeOrganizationId: firstOrg?.organizationId,
    },
  };
};
