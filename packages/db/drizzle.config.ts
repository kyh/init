import type { Config } from "drizzle-kit";

if (!process.env.POSTGRES_URL) {
  throw new Error("Missing POSTGRES_URL");
}

const nonPoolingUrl = process.env.POSTGRES_URL.replace(":6543", ":5432");

export default {
  dbCredentials: {
    url: nonPoolingUrl,
  },
  dialect: "postgresql",
  out: "./drizzle",
  schema: ["./src/drizzle-schema-auth.ts", "./src/drizzle-schema.ts"],
  schemaFilter: ["public"],
} satisfies Config;
