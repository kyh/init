import { describe, expect, it, vi } from "vitest";

import { createMockContext } from "../test-utils";
import { createCallerFactory } from "../trpc";
import { waitlistRouter } from "./waitlist-router";

const createCaller = createCallerFactory(waitlistRouter);

describe("waitlistRouter.join", () => {
  it("inserts waitlist entry with email and source", async () => {
    const ctx = createMockContext({ session: null });
    const created = { id: "wl-1", email: "hello@example.com", source: "", userId: undefined };
    const chain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([created]),
    };
    ctx.db.insert.mockReturnValue(chain);

    const caller = createCaller(ctx);
    const result = await caller.join({ email: "hello@example.com" });

    expect(result.waitlist).toEqual(created);
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ email: "hello@example.com", source: "" }),
    );
  });

  it("attaches userId when user is authenticated", async () => {
    const ctx = createMockContext();
    const created = { id: "wl-2", email: "user@example.com", source: "", userId: "user-1" };
    const chain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([created]),
    };
    ctx.db.insert.mockReturnValue(chain);

    const caller = createCaller(ctx);
    const result = await caller.join({ email: "user@example.com" });

    expect(result.waitlist?.userId).toBe("user-1");
    expect(chain.values).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1" }));
  });

  it("uses VERCEL_PROJECT_PRODUCTION_URL as source when set", async () => {
    const original = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "myapp.vercel.app";

    try {
      const ctx = createMockContext({ session: null });
      const created = {
        id: "wl-3",
        email: "a@b.com",
        source: "myapp.vercel.app",
        userId: undefined,
      };
      const chain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([created]),
      };
      ctx.db.insert.mockReturnValue(chain);

      const caller = createCaller(ctx);
      await caller.join({ email: "a@b.com" });

      expect(chain.values).toHaveBeenCalledWith(
        expect.objectContaining({ source: "myapp.vercel.app" }),
      );
    } finally {
      if (original === undefined) {
        delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      } else {
        process.env.VERCEL_PROJECT_PRODUCTION_URL = original;
      }
    }
  });

  it("works without authentication (public route)", async () => {
    const ctx = createMockContext({ session: null });
    const created = { id: "wl-4", email: "anon@example.com", source: "", userId: undefined };
    const chain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([created]),
    };
    ctx.db.insert.mockReturnValue(chain);

    const caller = createCaller(ctx);
    const result = await caller.join({ email: "anon@example.com" });

    expect(result.waitlist).toBeDefined();
  });
});
