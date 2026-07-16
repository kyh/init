import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "./env";
import * as schema from "./drizzle-schema";
import * as schemaAuth from "./drizzle-schema-auth";

const client = postgres(
  env.POSTGRES_URL,
  // POSTGRES_URL points at Supavisor's transaction-mode pooler (:6543) in
  // production, which does not support server-side prepared statements
  { prepare: false },
);

export const db = drizzle({
  client,
  schema: { ...schemaAuth, ...schema },
  casing: "snake_case",
});

export type Db = typeof db;
