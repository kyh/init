import { z } from "zod";

const envSchema = z.object({
  EMAIL_FROM: z.string().default("onboarding@resend.dev"),
  GITHUB_CLIENT_ID: z.string().default(""),
  GITHUB_CLIENT_SECRET: z.string().default(""),
  RESEND_API_KEY: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().default(""),
  STRIPE_SECRET_KEY: z.string().default("sk_test_placeholder"),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
});

export const env = envSchema.parse(process.env);
