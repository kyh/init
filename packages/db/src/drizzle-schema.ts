/**
 * Application schema
 */
import { relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";

import { organization, user } from "./drizzle-schema-auth";

export const waitlist = pgTable("waitlist", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t.text().references(() => user.id),
  source: t.text(),
  email: t.text(),
}));

export const waitlistRelations = relations(waitlist, ({ one }) => ({
  user: one(user, {
    fields: [waitlist.userId],
    references: [user.id],
  }),
}));

export const todo = pgTable("todo", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  organizationId: t
    .text()
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  title: t.text().notNull(),
  description: t.text(),
  completed: t.boolean().notNull().default(false),
  createdAt: t
    .timestamp({ withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: t
    .timestamp({ withTimezone: true })
    .notNull()
    .defaultNow(),
}));

export const todoRelations = relations(todo, ({ one }) => ({
  organization: one(organization, {
    fields: [todo.organizationId],
    references: [organization.id],
  }),
}));
