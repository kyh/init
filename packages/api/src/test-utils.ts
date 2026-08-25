import type { Mock } from "node:test";
import { mock } from "node:test";
import type { AnyRouter, InferRouterInitialContext } from "@orpc/server";
import { createRouterClient } from "@orpc/server";
import type { SQL, Table } from "drizzle-orm";
import type { Operators } from "drizzle-orm/relations";

import type { ORPCContext } from "./orpc";

const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  image: null,
  banned: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const mockSession = {
  user: mockUser,
  session: {
    id: "session-1",
    userId: "user-1",
    token: "token",
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ipAddress: null,
    userAgent: null,
  },
};

/** The slice of a drizzle relational-query config the tests read back. */
type MockQueryConfig = {
  where?: (table: Table, operators: Pick<Operators, "and" | "eq" | "ne">) => SQL | undefined;
  with?: { user?: { columns?: Record<string, boolean> } };
};

// Every stub is declared as returning void: routers reach these through the
// real drizzle types (see the assertion in createMockContext), so the mock's own
// signature only has to describe what a *test* reads back.
type MockQueryFn = Mock<(config?: MockQueryConfig) => void>;
type MockChainFn = Mock<(...args: unknown[]) => void>;

type MockChain = {
  values: MockChainFn;
  set: MockChainFn;
  where: MockChainFn;
  onConflictDoNothing: MockChainFn;
  returning: MockChainFn;
};

type MockDb = {
  query: {
    organization: { findFirst: MockQueryFn };
    member: { findFirst: MockQueryFn; findMany: MockQueryFn };
    todo: { findMany: MockQueryFn };
    invitation: { findMany: MockQueryFn };
    user: { findMany: MockQueryFn };
  };
  insert: MockChainFn;
  update: MockChainFn;
  delete: MockChainFn;
};

const queryFn = (): MockQueryFn => mock.fn<(config?: MockQueryConfig) => void>();

/** A drizzle insert/update/delete builder: every step returns the same chain. */
export function createMockChain(rows: unknown[] = []): MockChain {
  const step = (): MockChainFn => mock.fn<(...args: unknown[]) => void>(() => chain);
  const chain: MockChain = {
    values: step(),
    set: step(),
    where: step(),
    onConflictDoNothing: step(),
    returning: mock.fn<(...args: unknown[]) => void>(() => Promise.resolve(rows)),
  };
  return chain;
}

export function createMockDb(): MockDb {
  const chainFn = (): MockChainFn => {
    const chain = createMockChain();
    return mock.fn<(...args: unknown[]) => void>(() => chain);
  };
  return {
    query: {
      organization: { findFirst: queryFn() },
      member: { findFirst: queryFn(), findMany: queryFn() },
      todo: { findMany: queryFn() },
      invitation: { findMany: queryFn() },
      user: { findMany: queryFn() },
    },
    insert: chainFn(),
    update: chainFn(),
    delete: chainFn(),
  };
}

export function createMockContext(
  overrides: {
    session?: ORPCContext["session"];
    db?: MockDb;
  } = {},
): ORPCContext & { db: MockDb } {
  const db = overrides.db ?? createMockDb();
  return {
    session: overrides.session === undefined ? mockSession : overrides.session,
    // SAFETY: the one sanctioned assertion boundary — the chain mock stands in
    // for the real drizzle type (for ORPCContext) while staying MockDb (for
    // test access). The alternative — PGlite integration tests — is a separate
    // call; mockDeep would break the chain mocks. Any drift still fails loudly
    // at test runtime.
    // oxlint-disable-next-line typescript/consistent-type-assertions -- mock db meets the real context type only here
    db: db as ORPCContext["db"] & MockDb,
  };
}

/**
 * Binds a router once per test file. The returned caller invokes procedures
 * in-process against a mock context, running the real middleware chain.
 */
export const createCallerFactory =
  <T extends AnyRouter>(router: T) =>
  (context: ReturnType<typeof createMockContext> & InferRouterInitialContext<T>) =>
    createRouterClient(router, { context });

export { mockUser, mockSession };
