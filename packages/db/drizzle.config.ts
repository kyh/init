import type { Config } from "drizzle-kit";

// drizzle-kit's introspection and DDL stall behind a transaction-mode pooler,
// which is what POSTGRES_URL is in production. Hosted providers ship a direct
// URL alongside it; locally there is no pooler and POSTGRES_URL is direct.
const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;

if (!url) {
  throw new Error("Missing POSTGRES_URL");
}

export default {
  dbCredentials: {
    url,
  },
  dialect: "postgresql",
  out: "./drizzle",
  schema: ["./src/drizzle-schema-auth.ts", "./src/drizzle-schema.ts"],
  schemaFilter: ["public"],
} satisfies Config;
