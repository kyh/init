import { index, pgTableCreator } from "drizzle-orm/pg-core";

import { organization, user } from "./drizzle-schema-auth";

// Columns here carry no explicit SQL name, so the table builder derives them:
// `organizationId` is the `organization_id` column. Declare every table in this
// file through this creator, never the bare pgTable from drizzle-orm/pg-core.
const pgTable = pgTableCreator((name) => name, "snake_case");

// All tables enable RLS with no policies (deny-by-default): the public schema
// is reachable through PostgREST with the anon key, and authz lives in the API layer.
// The server's drizzle connection is unaffected (table owner bypasses RLS).
export const waitlist = pgTable.withRLS(
  "waitlist",
  (t) => ({
    email: t.text().notNull().unique(),
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    source: t.text(),
    userId: t.text().references(() => user.id, { onDelete: "set null" }),
  }),
  // Postgres doesn't auto-index FK columns; user deletions (incl. signup
  // rollback) would otherwise seq-scan to satisfy ON DELETE SET NULL.
  (table) => [index("waitlist_user_id_idx").on(table.userId)],
);

export const todo = pgTable.withRLS(
  "todo",
  (t) => ({
    completed: t.boolean().notNull().default(false),
    createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
    description: t.text(),
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    organizationId: t
      .text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    title: t.text().notNull(),
    updatedAt: t
      .timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (table) => [index("todo_organization_id_idx").on(table.organizationId)],
);
