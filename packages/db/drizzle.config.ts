import type { Config } from "drizzle-kit";

if (!process.env.POSTGRES_URL) {
  throw new Error("Missing POSTGRES_URL");
}

// Neon's pooled endpoint (`-pooler` in the hostname) fronts Postgres with
// PgBouncer in transaction mode, which drizzle-kit's DDL can't run through.
// Strip it for a direct connection; a no-op for local Postgres.
const nonPoolingUrl = process.env.POSTGRES_URL.replace("-pooler.", ".");

export default {
  schema: ["./src/drizzle-schema-auth.ts", "./src/drizzle-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: nonPoolingUrl,
  },
  schemaFilter: ["public"],
  casing: "snake_case",
} satisfies Config;
