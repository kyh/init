import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { relations } from "./drizzle-relations";

const client = postgres(
  process.env.POSTGRES_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  // POSTGRES_URL points at a transaction-mode pooler in production (Vercel
  // Postgres's pooled endpoint, `-pooler` in the hostname), which does not
  // support server-side prepared statements
  { prepare: false },
);

export const db = drizzle({ client, relations });

export type Db = typeof db;
