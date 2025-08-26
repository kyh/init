import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
import * as schemaAuth from "./schema-auth";

const client = postgres(
  process.env.POSTGRES_URL ??
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
);

export const db = drizzle({
  client,
  schema: { ...schemaAuth, ...schema },
  casing: "snake_case",
});

export type Db = typeof db;
