import { z } from "zod";

/**
 * The API package's server environment, parsed once at load. Every key is
 * optional or defaulted, so the app still boots with an empty .env — a missing
 * key disables its feature (GitHub OAuth, billing, transactional email) rather
 * than crashing. Parsing routes every read through one typed boundary instead
 * of scattering `process.env.X ?? ""` across the package.
 *
 * Platform-provided runtime vars (VERCEL_*, NODE_ENV, PORT) are intentionally
 * absent — they aren't app configuration, so they stay raw at their read sites.
 */
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
