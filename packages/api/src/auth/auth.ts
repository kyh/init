import type { User } from "better-auth";
import { cache } from "react";
import { headers } from "next/headers";
import { expo } from "@better-auth/expo";
import { stripe } from "@better-auth/stripe";
import { db } from "@repo/db/drizzle-client";
import { session as sessionSchema, user as userSchema } from "@repo/db/drizzle-schema-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, oAuthProxy, organization } from "better-auth/plugins";
import { and, eq, isNull } from "drizzle-orm";
import Stripe from "stripe";

import { env } from "../env";
import { sendEmail } from "../email/send-email";
import { FALLBACK_ORGANIZATION_SLUG, slugify } from "./utils";

// The SDK makes no network call until first use, so the placeholder key from the
// env boundary keeps local dev working with billing inert (checkout/portal fail,
// list works).
const stripeClient = new Stripe(env.STRIPE_SECRET_KEY);

const baseUrl =
  env.VERCEL_ENV === "production"
    ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    : env.VERCEL_ENV === "preview"
      ? `https://${env.VERCEL_URL}`
      : "http://localhost:3000";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  baseURL: baseUrl,
  plugins: [
    oAuthProxy({
      currentURL: baseUrl,
      productionURL: env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
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
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
      // Lazy customer creation keeps signup independent of Stripe config
      createCustomerOnSignUp: false,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "pro",
            priceId: env.STRIPE_PRO_PRICE_ID,
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
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
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

/** Current session, or null if not authenticated. React cache dedupes lookups within a request. */
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

/** Appends an incrementing suffix to the base slug until no organization claims it. */
const generateAvailableSlug = async (baseSlug: string, attempt = 0): Promise<string> => {
  const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
  const org = await db.query.organization.findFirst({
    where: (organization, { eq }) => eq(organization.slug, slug),
  });
  if (org) {
    return generateAvailableSlug(baseSlug, attempt + 1);
  }
  return slug;
};

/**
 * Creates the personal organization every new user gets. If creation fails the
 * user is deleted — the app assumes every user belongs to at least one org.
 */
const createDefaultOrganization = async (user: User) => {
  // A name in a script with no ASCII base ("李明") slugifies to "", which would
  // create an organization at the unroutable /dashboard/. Signup has no user to
  // prompt, so fall back to a generic base and let them rename it later.
  const slug = await generateAvailableSlug(slugify(user.name) || FALLBACK_ORGANIZATION_SLUG);

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
    // Roll back the signup — see the doc comment above
    await db.delete(userSchema).where(eq(userSchema.id, user.id));
    throw err;
  }
};

/** Defaults the session's active organization to the user's first membership. */
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
