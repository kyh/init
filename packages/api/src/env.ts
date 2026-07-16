import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Stripe stays optional even in production: lazy customer creation keeps
    // signup independent of billing config, and the placeholder key lets the app
    // boot with billing simply inert until real keys are set.
    STRIPE_SECRET_KEY: z.string().default("sk_test_placeholder"),
    STRIPE_WEBHOOK_SECRET: z.string().default(""),
    STRIPE_PRO_PRICE_ID: z.string().default(""),
    // GitHub OAuth is optional — email/password sign-in works without it.
    GITHUB_CLIENT_ID: z.string().default(""),
    GITHUB_CLIENT_SECRET: z.string().default(""),
    // Absent falls back to logging emails to the server console (send-email.ts).
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default("onboarding@resend.dev"),
    // Injected by Vercel; absent in local dev.
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
    VERCEL_URL: z.string().optional(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
