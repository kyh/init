/**
 * Guard in front of `drizzle-kit push`.
 *
 * `push` reconciles a database with this schema, so any table the target holds
 * and the schema does not define is offered up for rename or drop — a prompt at
 * best, silent data loss under `--force`. A foreign table is never a schema
 * drift to reconcile; it means POSTGRES_URL is pointed at some other app's
 * database. Refuse the push instead of letting drizzle ask.
 */
import { getTableName, is, Table } from "drizzle-orm";
import postgres from "postgres";

import * as schema from "./drizzle-schema";
import * as schemaAuth from "./drizzle-schema-auth";

export const definedTables = (): ReadonlySet<string> =>
  new Set(
    Object.values({ ...schemaAuth, ...schema }).flatMap((value) =>
      is(value, Table) ? [getTableName(value)] : [],
    ),
  );

export const foreignTables = (present: readonly string[], defined: ReadonlySet<string>) =>
  present.filter((name) => !defined.has(name)).toSorted();

const publicTables = async (url: string) => {
  const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 15 });
  try {
    const rows = await sql<{ name: string }[]>`
      select table_name as name
      from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'
    `;
    return rows.map((row) => row.name);
  } finally {
    await sql.end();
  }
};

const preflight = async (envFile: string) => {
  try {
    process.loadEnvFile(envFile);
  } catch {
    throw new Error(`db push aborted: no env file at ${envFile}.`);
  }

  const url = process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(`db push aborted: ${envFile} does not set POSTGRES_URL.`);
  }

  // Match drizzle.config.ts: the push runs against the direct connection, so the
  // guard has to inspect that same endpoint rather than the pooler.
  const target = url.replace(":6543", ":5432");
  const host = new URL(target).hostname;
  const foreign = foreignTables(await publicTables(target), definedTables());

  if (foreign.length > 0) {
    throw new Error(
      `db push aborted: ${host} holds ${foreign.length} table(s) this schema does not define.\n` +
        `  ${foreign.join(", ")}\n` +
        `Pushing would offer to rename or drop them. Point POSTGRES_URL at this app's own database.`,
    );
  }

  console.log(`db push preflight: ${host} holds no foreign tables.`);
};

if (import.meta.main) {
  const envFile = process.argv[2];
  try {
    if (!envFile) throw new Error("usage: push-preflight <env-file>");
    await preflight(envFile);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
