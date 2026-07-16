import type { User } from "better-auth";
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

import { sendEmail } from "../email/send-email";
import { FALLBACK_ORGANIZATION_SLUG, isSlugCollision, slugify } from "./utils";

// No network call until first use, so a placeholder key keeps local dev
// working without Stripe configured (checkout/portal will fail, list won't)
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder");

export const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_ENV === "preview"
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

// Origins allowed to drive authenticated requests. The web app, extension popup
// iframe, and desktop shell all run same-origin as baseUrl; React Native uses
// the expo:// scheme. Consumed by better-auth's own Origin checks and by the
// tRPC mutation guard (see packages/api/src/trpc.ts).
export const trustedOrigins = [baseUrl, "expo://"];

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
  trustedOrigins,
  // Persist rate-limit counters in Postgres. The default in-memory store keeps
  // per-instance counters, so on serverless (Vercel) the effective limit
  // multiplies across cold-started instances and resets on every deploy. 10
  // requests/60s per IP throttles credential-stuffing against the auth routes.
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 10,
  },
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
const MAX_SLUG_ATTEMPTS = 3;

/**
 * Creates the personal org, retrying on a slug collision. generateAvailableSlug
 * checks availability then inserts, so two concurrent signups can compute the
 * same slug and one loses the unique constraint — a fresh slug on retry clears
 * it. Bounded so a genuinely stuck slug can't loop forever.
 */
const createPersonalOrganization = async (user: User) => {
  // A name in a script with no ASCII base ("李明") slugifies to "", which would
  // create an organization at the unroutable /dashboard/. Signup has no user to
  // prompt, so fall back to a generic base and let them rename it later.
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
