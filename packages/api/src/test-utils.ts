import { mock } from "node:test";
import type { InferSelectModel, Table } from "drizzle-orm";
import { getColumns } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { relations } from "@repo/db/drizzle-relations";
import * as schemaAuth from "@repo/db/drizzle-schema-auth";

import type { ORPCContext } from "./orpc";

export const mockUser = {
  banned: null,
  createdAt: new Date("2024-01-01"),
  email: "test@example.com",
  emailVerified: true,
  id: "user-1",
  image: null,
  name: "Test User",
  updatedAt: new Date("2024-01-01"),
};

export const mockSession = {
  session: {
    createdAt: new Date("2024-01-01"),
    expiresAt: new Date("2099-01-01"),
    id: "session-1",
    ipAddress: null,
    token: "token",
    updatedAt: new Date("2024-01-01"),
    userAgent: null,
    userId: "user-1",
  },
  user: mockUser,
} satisfies NonNullable<ORPCContext["session"]>;

export const mockOrganization = {
  createdAt: new Date("2024-01-01"),
  id: "org-1",
  logo: null,
  metadata: null,
  name: "Acme",
  slug: "acme",
} satisfies typeof schemaAuth.organization.$inferSelect;

export const mockMembership = {
  createdAt: new Date("2024-01-01"),
  id: "mem-1",
  organizationId: "org-1",
  role: "owner",
  userId: "user-1",
} satisfies typeof schemaAuth.member.$inferSelect;

// Postgres returns positional rows; derive their order from the real schema.
export const databaseRows = <T extends Table>(table: T, ...rows: InferSelectModel<T>[]) =>
  rows.map((row) => {
    const values = new Map<string, unknown>(Object.entries(row));
    return Object.entries(getColumns(table)).map(([key, column]) => {
      const value = values.get(key);
      if (!(value instanceof Date)) {
        return value;
      }
      const timestamp = value.toISOString();
      return column.getSQLType() === "timestamp" ? timestamp.replace("Z", "") : timestamp;
    });
  });

export const createMockContext = (session: ORPCContext["session"] = mockSession) => {
  const db = drizzle({
    connection: "postgresql://unused:unused@localhost/unused",
    relations,
  });
  const responses: unknown[][][] = [];
  const query = mock.fn((sql: string, params: readonly unknown[]) => {
    const rows = responses.shift();
    if (!rows) {
      throw new Error(`Unexpected database query: ${sql} (${params.length} parameters)`);
    }
    return { values: () => Promise.resolve(rows) };
  });
  // Keep Drizzle's query generation and result mapping; replace only database I/O.
  mock.method(db.$client, "unsafe", query);
  const context = { db, session } satisfies ORPCContext;
  return { ...context, query, responses };
};

export const createMemberContext = () => {
  const context = createMockContext();
  context.responses.push(
    databaseRows(schemaAuth.organization, mockOrganization),
    databaseRows(schemaAuth.member, mockMembership),
  );
  return context;
};
