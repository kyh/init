import postgres from "postgres";

/**
 * Revokes all Data API (PostgREST) access to the public schema, matching
 * Supabase's no-auto-grant default for new projects (May 2026). With zero
 * grants for `anon`/`authenticated`, the Data API serves nothing even where
 * it's still enabled — enforced from the repo instead of a dashboard toggle.
 *
 * The app is unaffected: tRPC/Drizzle connect as the table owner, and
 * storage uses the service role. Runs after every `pnpm db:push` /
 * `db:push-remote` (see package.json).
 */
const sql = postgres(
  process.env.POSTGRES_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  { prepare: false, max: 1 },
);

await sql`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated`;
await sql`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated`;
await sql`REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated`;
await sql`REVOKE USAGE ON SCHEMA public FROM anon, authenticated`;
// Future tables created by schema pushes get no grants either
await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated`;
await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated`;
await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated`;

console.info("[lockdown] public schema grants revoked for anon/authenticated");

await sql.end();
