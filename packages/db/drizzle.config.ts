import type { Config } from "drizzle-kit";

// WARNING: drizzle-kit stalls behind a transaction-mode pooler, so it needs the direct (non-pooling) URL.
const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;

if (url === undefined || url === "") {
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
