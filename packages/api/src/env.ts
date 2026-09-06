import { z } from "zod";

/** Optional integrations must not prevent local boot. Platform runtime variables stay at their read sites. */
const envSchema = z.object({
  // "Continue with GitHub". Empty leaves the social provider unconfigured.
  GITHUB_CLIENT_ID: z.string().default(""),
  GITHUB_CLIENT_SECRET: z.string().default(""),
  // Stripe billing. The placeholder lets the client construct offline; billing
  // calls fail until a real key is set (list still works, checkout/portal don't).
  STRIPE_SECRET_KEY: z.string().default("sk_test_placeholder"),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  STRIPE_PRO_PRICE_ID: z.string().default(""),
  // Transactional email (Resend). Absent, emails log to the console instead.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("onboarding@resend.dev"),
});

export const env = envSchema.parse(process.env);
