import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// In production POSTGRES_URL must be provided — a missing value has to fail the
// build, not silently fall back to a local database (the worst-case symptom this
// boundary exists to prevent). Locally it defaults to the bundled Supabase
// instance so a fresh clone runs with no configuration.
const isProduction = process.env.VERCEL_ENV === "production";

export const env = createEnv({
  server: {
    POSTGRES_URL: isProduction
      ? z.string().url()
      : z.string().url().default("postgresql://postgres:postgres@127.0.0.1:54322/postgres"),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
