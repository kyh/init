import { vi } from "vitest";

import type { TRPCContext } from "./trpc";

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

type MockDb = {
  query: {
    organization: { findFirst: ReturnType<typeof vi.fn> };
    member: { findFirst: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
    todo: { findMany: ReturnType<typeof vi.fn> };
    invitation: { findMany: ReturnType<typeof vi.fn> };
    user: { findMany: ReturnType<typeof vi.fn> };
  };
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const chainable = () => {
  const chain = {
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
  };
  return chain;
};

export function createMockDb(): MockDb {
  return {
    query: {
      organization: { findFirst: vi.fn() },
      member: { findFirst: vi.fn(), findMany: vi.fn() },
      todo: { findMany: vi.fn() },
      invitation: { findMany: vi.fn() },
      user: { findMany: vi.fn() },
    },
    insert: vi.fn().mockReturnValue(chainable()),
    update: vi.fn().mockReturnValue(chainable()),
    delete: vi.fn().mockReturnValue(chainable()),
  };
}

export function createMockContext(
  overrides: {
    session?: TRPCContext["session"] | null;
    db?: MockDb;
    origin?: string | null;
    secFetchSite?: string | null;
  } = {},
): TRPCContext & { db: MockDb } {
  const db = overrides.db ?? createMockDb();
  // The one sanctioned assertion boundary: plain-object chain mocks meet the
  // real drizzle context type here and nowhere else. The alternative — PGlite
  // integration tests — is a separate call; mockDeep would break the chain
  // mocks. Any drift still fails loudly at test runtime.
  return {
    session: overrides.session === undefined ? mockSession : overrides.session,
    // The single sanctioned assertion: the chain mock is both the real drizzle
    // type (for TRPCContext) and MockDb (for test access). Casting to the
    // intersection once lets the object satisfy the return type with no outer
    // cast.
    // oxlint-disable-next-line typescript/consistent-type-assertions -- mock db meets the real context type only here
    db: db as unknown as TRPCContext["db"] & MockDb,
    // Default to no browser provenance — mutations pass the origin guard unless
    // a test opts into cross-origin headers.
    origin: overrides.origin ?? null,
    secFetchSite: overrides.secFetchSite ?? null,
  };
}

export { mockUser, mockSession };
