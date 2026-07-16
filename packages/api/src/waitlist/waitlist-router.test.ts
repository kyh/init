import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockContext } from "../test-utils";
import { createCallerFactory } from "../trpc";
import { waitlistRouter } from "./waitlist-router";

// The router reads the deployment URL from the validated env boundary, which
// t3-env freezes at import — so mutating process.env at runtime wouldn't reach
// it. Mock the module with a mutable object instead. The shape must cover every
// field auth.ts reads at import (the module graph pulls it in via trpc).
type MockApiEnv = {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRO_PRICE_ID: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  RESEND_API_KEY: string | undefined;
  EMAIL_FROM: string;
  VERCEL_ENV: string | undefined;
  VERCEL_URL: string | undefined;
  VERCEL_PROJECT_PRODUCTION_URL: string | undefined;
};

const { mockEnv } = vi.hoisted(() => {
  const mockEnv: MockApiEnv = {
    STRIPE_SECRET_KEY: "sk_test_placeholder",
    STRIPE_WEBHOOK_SECRET: "",
    STRIPE_PRO_PRICE_ID: "",
    GITHUB_CLIENT_ID: "",
    GITHUB_CLIENT_SECRET: "",
    RESEND_API_KEY: undefined,
    EMAIL_FROM: "onboarding@resend.dev",
    VERCEL_ENV: undefined,
    VERCEL_URL: undefined,
    VERCEL_PROJECT_PRODUCTION_URL: undefined,
  };
  return { mockEnv };
});

vi.mock("../env", () => ({ env: mockEnv }));

const createCaller = createCallerFactory(waitlistRouter);

const insertChain = (created: unknown) => ({
  values: vi.fn().mockReturnThis(),
  onConflictDoNothing: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([created]),
});

beforeEach(() => {
  mockEnv.VERCEL_PROJECT_PRODUCTION_URL = undefined;
});

describe("waitlistRouter.join", () => {
  it("stores a null source when no deployment URL is configured", async () => {
    const ctx = createMockContext({ session: null });
    const created = { id: "wl-1", email: "hello@example.com", source: null, userId: undefined };
    const chain = insertChain(created);
    ctx.db.insert.mockReturnValue(chain);

    const caller = createCaller(ctx);
    const result = await caller.join({ email: "hello@example.com" });

    expect(result.waitlist).toEqual(created);
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ email: "hello@example.com", source: null }),
    );
  });

  it("uses VERCEL_PROJECT_PRODUCTION_URL as source when set", async () => {
    mockEnv.VERCEL_PROJECT_PRODUCTION_URL = "myapp.vercel.app";

    const ctx = createMockContext({ session: null });
    const created = { id: "wl-3", email: "a@b.com", source: "myapp.vercel.app", userId: undefined };
    const chain = insertChain(created);
    ctx.db.insert.mockReturnValue(chain);

    const caller = createCaller(ctx);
    await caller.join({ email: "a@b.com" });

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ source: "myapp.vercel.app" }),
    );
  });

  it("attaches userId when user is authenticated", async () => {
    const ctx = createMockContext();
    const created = { id: "wl-2", email: "user@example.com", source: null, userId: "user-1" };
    const chain = insertChain(created);
    ctx.db.insert.mockReturnValue(chain);

    const caller = createCaller(ctx);
    const result = await caller.join({ email: "user@example.com" });

    expect(result.waitlist?.userId).toBe("user-1");
    expect(chain.values).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1" }));
  });

  it("works without authentication (public route)", async () => {
    const ctx = createMockContext({ session: null });
    const created = { id: "wl-4", email: "anon@example.com", source: null, userId: undefined };
    const chain = insertChain(created);
    ctx.db.insert.mockReturnValue(chain);

    const caller = createCaller(ctx);
    const result = await caller.join({ email: "anon@example.com" });

    expect(result.waitlist).toBeDefined();
  });
});
