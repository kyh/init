import type { User } from "better-auth";
import { expo } from "@better-auth/expo";
import { stripe } from "@better-auth/stripe";
import { db } from "@repo/db/drizzle-client";
import { session as sessionSchema, user as userSchema } from "@repo/db/drizzle-schema-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, genericOAuth, oAuthProxy, organization } from "better-auth/plugins";
import { and, eq, isNull } from "drizzle-orm";
import Stripe from "stripe";

import { sendEmail } from "../email/send-email";
import { env } from "../env";
import { ac, roles, hasPermission } from "./permissions";
import { FALLBACK_ORGANIZATION_SLUG, isSlugCollision, slugify } from "./utils";

// The placeholder constructs offline; checkout requires a configured key.
const stripeClient = new Stripe(env.STRIPE_SECRET_KEY);

export const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_ENV === "preview"
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT ?? 3000}`;

// Web, desktop and extension are same-origin; React Native uses expo://.
const trustedOrigins = [baseUrl, "expo://"];

// Local GitHub OAuth emulator; leave unset in production.
const emulatorUrl = process.env.NEXT_PUBLIC_GITHUB_EMULATOR_URL;

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
      ac,
      roles,
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
        authorizeReference: async ({ user, referenceId }) => {
          const membership = await db.query.member.findFirst({
            where: (member, { and, eq }) =>
              and(eq(member.organizationId, referenceId), eq(member.userId, user.id)),
          });
          return hasPermission(membership?.role, { billing: ["manage"] });
        },
      },
    }),
    // The built-in GitHub provider hardcodes endpoints; genericOAuth supplies local emulator URLs.
    ...(emulatorUrl
      ? [
          genericOAuth({
            config: [
              {
                providerId: "github",
                clientId: "init-local-github",
                clientSecret: "init-local-github-secret",
                authorizationUrl: `${emulatorUrl}/login/oauth/authorize`,
                tokenUrl: `${emulatorUrl}/login/oauth/access_token`,
                userInfoUrl: `${emulatorUrl}/user`,
              },
            ],
          }),
        ]
      : []),
    nextCookies(),
  ],
  emailAndPassword: {
    enabled: true,
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
  trustedOrigins,
  // Database counters survive serverless instance churn.
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 10,
  },
  advanced: {
    defaultCookieAttributes: {
      // RPC relies on SameSite plus its Origin check for CSRF protection.
      sameSite: "lax",
      secure: true,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: (user) => createDefaultOrganization(user),
      },
    },
    session: {
      create: {
        before: (session) => setActiveOrganization(session),
      },
    },
  },
});

export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"];

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

const MAX_SLUG_ATTEMPTS = 3;

/** Availability checks race with concurrent signups; retry unique-constraint failures. */
const createPersonalOrganization = async (user: User) => {
  // Names without an ASCII base need a routable fallback.
  const baseSlug = slugify(user.name) || FALLBACK_ORGANIZATION_SLUG;

  for (let attempt = 1; ; attempt++) {
    const slug = await generateAvailableSlug(baseSlug);
    try {
      return await auth.api.createOrganization({
        body: {
          userId: user.id,
          name: "Personal Organization",
          slug,
          metadata: {
            personal: true,
          },
        },
      });
    } catch (err) {
      if (attempt < MAX_SLUG_ATTEMPTS && isSlugCollision(err)) {
        continue;
      }
      throw err;
    }
  }
};

/** Roll back signup if personal-organization creation fails: every user needs a membership. */
const createDefaultOrganization = async (user: User) => {
  try {
    const createdOrganization = await createPersonalOrganization(user);

    // The signup session is created before this hook finishes, so the
    // session.create.before hook found no membership — backfill it
    if (createdOrganization) {
      await db
        .update(sessionSchema)
        .set({ activeOrganizationId: createdOrganization.id })
        .where(and(eq(sessionSchema.userId, user.id), isNull(sessionSchema.activeOrganizationId)));
    }
  } catch (err) {
    await db.delete(userSchema).where(eq(userSchema.id, user.id));
    throw err;
  }
};

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
