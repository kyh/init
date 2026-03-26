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

export function createMockDb(): MockDb {
  const chainable = () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };
    return chain;
  };

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
  overrides: { session?: TRPCContext["session"] | null; db?: MockDb } = {},
): TRPCContext & { db: MockDb } {
  const db = overrides.db ?? createMockDb();
  return {
    session: overrides.session === undefined ? mockSession : overrides.session,
    db: db as unknown as TRPCContext["db"],
  } as TRPCContext & { db: MockDb };
}

export { mockUser, mockSession };
