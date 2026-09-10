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
import { Stripe } from "stripe";

import { sendEmail } from "../email/send-email";
import { env } from "../env";
import { ac, roles, hasPermission } from "./permissions";
import { FALLBACK_ORGANIZATION_SLUG, isSlugCollision, slugify } from "./utils";

// The placeholder constructs offline; checkout requires a configured key.
const stripeClient = new Stripe(env.STRIPE_SECRET_KEY);

const resolveBaseUrl = () => {
  if (process.env.VERCEL_ENV === "production") {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const baseUrl = resolveBaseUrl();

// Web, desktop and extension are same-origin; React Native uses expo://.
const trustedOrigins = [baseUrl, "expo://"];

// Local GitHub OAuth emulator; leave unset in production.
const emulatorUrl = process.env.NEXT_PUBLIC_GITHUB_EMULATOR_URL;

const generateAvailableSlug = async (baseSlug: string, attempt = 0): Promise<string> => {
  const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
  const org = await db.query.organization.findFirst({ where: { slug } });
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

  for (let attempt = 1; ; attempt += 1) {
    const slug = await generateAvailableSlug(baseSlug);
    try {
      // oxlint-disable-next-line no-use-before-define -- the signup hook creates the organization through the auth instance it is registered on
      return await auth.api.createOrganization({
        body: {
          metadata: {
            personal: true,
          },
          name: "Personal Organization",
          slug,
          userId: user.id,
        },
      });
    } catch (error) {
      if (attempt < MAX_SLUG_ATTEMPTS && isSlugCollision(error)) {
        continue;
      }
      throw error;
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
  } catch (error) {
    await db.delete(userSchema).where(eq(userSchema.id, user.id));
    throw error;
  }
};

const setActiveOrganization = async (session: { userId: string }) => {
  const firstOrg = await db.query.member.findFirst({ where: { userId: session.userId } });

  return {
    data: {
      ...session,
      activeOrganizationId: firstOrg?.organizationId,
    },
  };
};

export const auth = betterAuth({
  advanced: {
    defaultCookieAttributes: {
      // RPC relies on SameSite plus its Origin check for CSRF protection.
      sameSite: "lax",
      secure: true,
    },
  },
  baseURL: baseUrl,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  databaseHooks: {
    session: {
      create: {
        before: (session) => setActiveOrganization(session),
      },
    },
    user: {
      create: {
        after: (user) => createDefaultOrganization(user),
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        subject: "Reset your password",
        text: `Click the link to reset your password: ${url}`,
        to: user.email,
      });
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        subject: "Verify your email",
        text: `Click the link to verify your email: ${url}`,
        to: user.email,
      });
    },
  },
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
          subject: `You've been invited to ${data.organization.name}`,
          text: `Accept the invitation: ${baseUrl}/auth/invitation/${data.id}`,
          to: data.email,
        });
      },
    }),
    admin(),
    stripe({
      // Lazy customer creation keeps signup independent of Stripe config
      createCustomerOnSignUp: false,
      stripeClient,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
      subscription: {
        authorizeReference: async ({ user, referenceId }) => {
          const membership = await db.query.member.findFirst({
            where: { organizationId: referenceId, userId: user.id },
          });
          return hasPermission(membership?.role, { billing: ["manage"] });
        },
        enabled: true,
        plans: [
          {
            name: "pro",
            priceId: env.STRIPE_PRO_PRICE_ID,
          },
        ],
      },
    }),
    // The built-in GitHub provider hardcodes endpoints; genericOAuth supplies local emulator URLs.
    ...(emulatorUrl
      ? [
          genericOAuth({
            config: [
              {
                authorizationUrl: `${emulatorUrl}/login/oauth/authorize`,
                clientId: "init-local-github",
                clientSecret: "init-local-github-secret",
                providerId: "github",
                tokenUrl: `${emulatorUrl}/login/oauth/access_token`,
                userInfoUrl: `${emulatorUrl}/user`,
              },
            ],
          }),
        ]
      : []),
    nextCookies(),
  ],
  // Database counters survive serverless instance churn.
  rateLimit: {
    enabled: true,
    max: 10,
    storage: "database",
    window: 60,
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  trustedOrigins,
});

export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"];
