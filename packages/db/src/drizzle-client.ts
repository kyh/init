import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { relations } from "./drizzle-relations";

const client = postgres(
  process.env.POSTGRES_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  // POSTGRES_URL is the pooled URL in production, and transaction-mode
  // poolers do not support server-side prepared statements
  { prepare: false },
);

export const db = drizzle({ client, relations });

export type Db = typeof db;
