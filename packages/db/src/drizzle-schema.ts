import { index, pgTableCreator } from "drizzle-orm/pg-core";

import { organization, user } from "./drizzle-schema-auth";

// WARNING: declare every table here through this creator with withRLS, never drizzle-orm's bare pgTable.
const pgTable = pgTableCreator((name) => name, "snake_case");

export const waitlist = pgTable.withRLS(
  "waitlist",
  (t) => ({
    email: t.text().notNull().unique(),
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    source: t.text(),
    userId: t.text().references(() => user.id, { onDelete: "set null" }),
  }),
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
