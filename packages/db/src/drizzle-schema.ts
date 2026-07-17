/**
 * Application schema
 */
import { relations } from "drizzle-orm";
import { index, pgTable } from "drizzle-orm/pg-core";

import { organization, user } from "./drizzle-schema-auth";

// All tables enable RLS with no policies (deny-by-default): the public schema
// is reachable through PostgREST with the anon key, and authz lives in tRPC.
// The server's drizzle connection is unaffected (table owner bypasses RLS).
export const waitlist = pgTable(
  "waitlist",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    userId: t.text().references(() => user.id, { onDelete: "set null" }),
    source: t.text(),
    email: t.text().notNull().unique(),
  }),
  // Postgres doesn't auto-index FK columns; user deletions (incl. signup
  // rollback) would otherwise seq-scan to satisfy ON DELETE SET NULL.
  (table) => [index("waitlist_user_id_idx").on(table.userId)],
).enableRLS();

export const waitlistRelations = relations(waitlist, ({ one }) => ({
  user: one(user, {
    fields: [waitlist.userId],
    references: [user.id],
  }),
}));

export const todo = pgTable(
  "todo",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    organizationId: t
      .text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    title: t.text().notNull(),
    description: t.text(),
    completed: t.boolean().notNull().default(false),
    createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: t
      .timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (table) => [index("todo_organization_id_idx").on(table.organizationId)],
).enableRLS();

export const todoRelations = relations(todo, ({ one }) => ({
  organization: one(organization, {
    fields: [todo.organizationId],
    references: [organization.id],
  }),
}));
