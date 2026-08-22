import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { createMockChain, createMockContext } from "../test-utils";
import { createCallerFactory } from "../trpc";
import { waitlistRouter } from "./waitlist-router";

const createCaller = createCallerFactory(waitlistRouter);

describe("waitlistRouter.join", () => {
  test("inserts waitlist entry with email and source", async () => {
    const ctx = createMockContext({ session: null });
    const created = { id: "wl-1", email: "hello@example.com", source: "", userId: undefined };
    const chain = createMockChain([created]);
    ctx.db.insert.mock.mockImplementation(() => chain);

    const caller = createCaller(ctx);
    const result = await caller.join({ email: "hello@example.com" });

    assert.deepEqual(result.waitlist, created);
    assert.partialDeepStrictEqual(chain.values.mock.calls[0]?.arguments[0], {
      email: "hello@example.com",
      source: "",
    });
  });

  test("attaches userId when user is authenticated", async () => {
    const ctx = createMockContext();
    const created = { id: "wl-2", email: "user@example.com", source: "", userId: "user-1" };
    const chain = createMockChain([created]);
    ctx.db.insert.mock.mockImplementation(() => chain);

    const caller = createCaller(ctx);
    const result = await caller.join({ email: "user@example.com" });

    assert.strictEqual(result.waitlist?.userId, "user-1");
    assert.partialDeepStrictEqual(chain.values.mock.calls[0]?.arguments[0], { userId: "user-1" });
  });

  test("uses VERCEL_PROJECT_PRODUCTION_URL as source when set", async () => {
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
      const chain = createMockChain([created]);
      ctx.db.insert.mock.mockImplementation(() => chain);

      const caller = createCaller(ctx);
      await caller.join({ email: "a@b.com" });

      assert.partialDeepStrictEqual(chain.values.mock.calls[0]?.arguments[0], {
        source: "myapp.vercel.app",
      });
    } finally {
      if (original === undefined) {
        delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      } else {
        process.env.VERCEL_PROJECT_PRODUCTION_URL = original;
      }
    }
  });

  test("works without authentication (public route)", async () => {
    const ctx = createMockContext({ session: null });
    const created = { id: "wl-4", email: "anon@example.com", source: "", userId: undefined };
    const chain = createMockChain([created]);
    ctx.db.insert.mock.mockImplementation(() => chain);

    const caller = createCaller(ctx);
    const result = await caller.join({ email: "anon@example.com" });

    assert.notStrictEqual(result.waitlist, undefined);
  });
});
