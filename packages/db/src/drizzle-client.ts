import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { relations } from "./drizzle-relations";

const client = postgres(
  process.env.POSTGRES_URL ?? "postgresql://postgres:postgres@127.0.0.1:1/postgres",
  // WARNING: production POSTGRES_URL is a transaction-mode pooler, which breaks server-side prepared statements.
  { prepare: false },
);

export const db = drizzle({ client, relations });

export type Db = typeof db;
