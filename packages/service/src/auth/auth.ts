import type { User } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { expo } from "@better-auth/expo";
import { stripe } from "@better-auth/stripe";
import { ac, roles, hasPermission } from "@repo/permissions";
import { FALLBACK_ORGANIZATION_SLUG, slugify } from "@repo/permissions/slug";
import { db } from "@repo/db/drizzle-client";
import { session as sessionSchema, user as userSchema } from "@repo/db/drizzle-schema-auth";
import { betterAuth, logger } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin, emailOTP, genericOAuth, oAuthProxy, organization } from "better-auth/plugins";
import { and, eq, isNull } from "drizzle-orm";
import { Stripe } from "stripe";

import { EMAIL_MODE, EMAIL_OFF_WARNING, sendEmail } from "../email/send-email";
import { env } from "../env";
import { isSlugCollision } from "./utils";

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

const sendsEmail = EMAIL_MODE.kind !== "off";

if (!sendsEmail) {
  console.warn(`[email] ${EMAIL_OFF_WARNING}`);
}

const trustedOrigins = [baseUrl, "expo://"];

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const emulatorUrl = process.env.NEXT_PUBLIC_GITHUB_EMULATOR_URL;

const generateAvailableSlug = async (baseSlug: string, attempt = 0) => {
  const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
  const org = await db.query.organization.findFirst({ where: { slug } });

  if (org) {
    return await generateAvailableSlug(baseSlug, attempt + 1);
  }

  return slug;
};

const MAX_SLUG_ATTEMPTS = 3;

const createPersonalOrganization = async (user: User) => {
  const baseSlug = slugify(user.name) || FALLBACK_ORGANIZATION_SLUG;

  for (let attempt = 1; ; attempt += 1) {
    // oxlint-disable-next-line no-await-in-loop -- each attempt needs the previous one's collision
    const slug = await generateAvailableSlug(baseSlug);

    try {
      // oxlint-disable-next-line no-await-in-loop -- each attempt needs the previous one's collision
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

const createRequiredOrganization = async (user: User) => {
  try {
    return await createPersonalOrganization(user);
  } catch (error) {
    await db.delete(userSchema).where(eq(userSchema.id, user.id));
    throw error;
  }
};

const createDefaultOrganization = async (user: User) => {
  const createdOrganization = await createRequiredOrganization(user);

  try {
    await db
      .update(sessionSchema)
      .set({ activeOrganizationId: createdOrganization.id })
      .where(and(eq(sessionSchema.userId, user.id), isNull(sessionSchema.activeOrganizationId)));
  } catch (error) {
    logger.error("Failed to set the active organization on the signup session", error);
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

// WARNING: better-auth logs what a sender throws and answers success, so a refusal must come before it.
const refuseCodesWithoutMail = createAuthMiddleware(async (ctx) => {
  if (ctx.path === "/email-otp/send-verification-otp") {
    throw APIError.from("SERVICE_UNAVAILABLE", {
      code: "EMAIL_DISABLED",
      message: "Sign-in by email is unavailable: this site sends no email.",
    });
  }

  await Promise.resolve();
});

export const auth = betterAuth({
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: true,
    },
  },
  baseURL: baseUrl,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  hooks: sendsEmail ? undefined : { before: refuseCodesWithoutMail },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => await setActiveOrganization(session),
      },
    },
    user: {
      create: {
        after: async (user) => {
          await createDefaultOrganization(user);
        },
      },
    },
  },
  plugins: [
    oAuthProxy({
      currentURL: baseUrl,
      productionURL:
        productionHost === undefined || productionHost === ""
          ? baseUrl
          : `https://${productionHost}`,
    }),
    expo(),
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type !== "sign-in" || !sendsEmail) {
          return;
        }

        await sendEmail({
          subject: "Your sign-in code",
          text: `Your sign-in code is ${otp}. It expires in 5 minutes. If you didn't ask for it, ignore this email.`,
          to: email,
        });
      },
    }),
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
    ...(emulatorUrl !== undefined && emulatorUrl !== ""
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
