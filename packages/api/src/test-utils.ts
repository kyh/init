import { mock } from "node:test";
import type { InferSelectModel, Table } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@repo/db/drizzle-schema";
import * as schemaAuth from "@repo/db/drizzle-schema-auth";

import type { ORPCContext } from "./orpc";

export const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  image: null,
  banned: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const mockSession = {
  user: mockUser,
  session: {
    id: "session-1",
    userId: "user-1",
    token: "token",
    expiresAt: new Date("2099-01-01"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ipAddress: null,
    userAgent: null,
  },
} satisfies NonNullable<ORPCContext["session"]>;

export const mockOrganization = {
  id: "org-1",
  name: "Acme",
  slug: "acme",
  logo: null,
  metadata: null,
  createdAt: new Date("2024-01-01"),
} satisfies typeof schemaAuth.organization.$inferSelect;

export const mockMembership = {
  id: "mem-1",
  organizationId: "org-1",
  userId: "user-1",
  role: "owner",
  createdAt: new Date("2024-01-01"),
} satisfies typeof schemaAuth.member.$inferSelect;

// Postgres returns positional rows; derive their order from the real schema.
export function databaseRows<T extends Table>(table: T, ...rows: InferSelectModel<T>[]) {
  return rows.map((row) => {
    const values = new Map<string, unknown>(Object.entries(row));
    return Object.entries(getTableColumns(table)).map(([key, column]) => {
      const value = values.get(key);
      if (!(value instanceof Date)) return value;
      const timestamp = value.toISOString();
      return column.getSQLType() === "timestamp" ? timestamp.replace("Z", "") : timestamp;
    });
  });
}

export function createMockContext(session: ORPCContext["session"] = mockSession) {
  const db = drizzle({
    connection: "postgresql://unused:unused@localhost/unused",
    schema: { ...schemaAuth, ...schema },
    casing: "snake_case",
  });
  const responses: unknown[][][] = [];
  const query = mock.fn((sql: string, params: readonly unknown[]) => {
    const rows = responses.shift();
    if (!rows) throw new Error(`Unexpected database query: ${sql} (${params.length} parameters)`);
    return { values: async () => rows };
  });
  // Keep Drizzle's query generation and result mapping; replace only database I/O.
  mock.method(db.$client, "unsafe", query);
  const context = { session, db } satisfies ORPCContext;
  return { ...context, query, responses };
}

export function createMemberContext() {
  const context = createMockContext();
  context.responses.push(
    databaseRows(schemaAuth.organization, mockOrganization),
    databaseRows(schemaAuth.member, mockMembership),
  );
  return context;
}
