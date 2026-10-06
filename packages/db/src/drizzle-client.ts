import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { relations } from "./drizzle-relations";

const client = postgres(
  // Locally `pnpm db:start` writes POSTGRES_URL into .env: each checkout and git branch
  // gets its own database on its own port, so there is no fixed local default. The
  // fallback only lets code that never queries (a build, a unit test) import this;
  // postgres.js connects lazily, and nothing listens on port 1.
  process.env.POSTGRES_URL ?? "postgresql://postgres:postgres@127.0.0.1:1/postgres",
  // POSTGRES_URL is the pooled URL in production, and transaction-mode
  // poolers do not support server-side prepared statements
  { prepare: false },
);

export const db = drizzle({ client, relations });

export type Db = typeof db;
