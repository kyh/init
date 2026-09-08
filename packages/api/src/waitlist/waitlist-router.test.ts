import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createRouterClient } from "@orpc/server";
import { waitlist } from "@repo/db/drizzle-schema";

import { createMockContext, databaseRows } from "../test-utils";
import { waitlistRouter } from "./waitlist-router";

describe("waitlistRouter.join", () => {
  test("accepts anonymous signup and ignores duplicate email conflicts", async () => {
    const context = createMockContext(null);
    const entry = { email: "hello@example.com", id: "wl-1", source: "", userId: null };
    context.responses.push(databaseRows(waitlist, entry), []);
    const caller = createRouterClient(waitlistRouter, { context });

    assert.deepEqual(await caller.join({ email: entry.email }), { waitlist: entry });
    assert.deepEqual(await caller.join({ email: entry.email }), { waitlist: null });
    const [query] = context.query.mock.calls;
    assert.ok(query);
    assert.match(query.arguments[0], /on conflict \("email"\) do nothing/u);
    assert.deepEqual(query.arguments[1], [
      entry.email,
      process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "",
    ]);
  });

  test("attaches the current user to authenticated signups", async () => {
    const context = createMockContext();
    const entry = { email: "user@example.com", id: "wl-2", source: "", userId: "user-1" };
    context.responses.push(databaseRows(waitlist, entry));
    const caller = createRouterClient(waitlistRouter, { context });

    assert.deepEqual(await caller.join({ email: entry.email }), { waitlist: entry });
    assert.deepEqual(context.query.mock.calls[0]?.arguments[1], [
      entry.email,
      process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "",
      "user-1",
    ]);
  });

  test("rejects an invalid email before querying", async () => {
    const context = createMockContext(null);
    const caller = createRouterClient(waitlistRouter, { context });
    await assert.rejects(caller.join({ email: "invalid" }), { code: "BAD_REQUEST" });
    assert.equal(context.query.mock.callCount(), 0);
  });
});
