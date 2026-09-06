import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createRouterClient } from "@orpc/server";
import { waitlist } from "@repo/db/drizzle-schema";

import { createMockContext, databaseRows } from "../test-utils";
import { waitlistRouter } from "./waitlist-router";

describe("waitlistRouter.join", () => {
  test("accepts anonymous signup and ignores duplicate email conflicts", async () => {
    const context = createMockContext(null);
    const entry = { id: "wl-1", email: "hello@example.com", source: "", userId: null };
    context.responses.push(databaseRows(waitlist, entry), []);
    const caller = createRouterClient(waitlistRouter, { context });

    assert.deepEqual(await caller.join({ email: entry.email }), { waitlist: entry });
    assert.deepEqual(await caller.join({ email: entry.email }), { waitlist: null });
    const query = context.query.mock.calls[0];
    assert.ok(query);
    assert.match(query.arguments[0], /on conflict \("email"\) do nothing/);
    assert.deepEqual(query.arguments[1], [
      process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "",
      entry.email,
    ]);
  });

  test("attaches the current user to authenticated signups", async () => {
    const context = createMockContext();
    const entry = { id: "wl-2", email: "user@example.com", source: "", userId: "user-1" };
    context.responses.push(databaseRows(waitlist, entry));
    const caller = createRouterClient(waitlistRouter, { context });

    assert.deepEqual(await caller.join({ email: entry.email }), { waitlist: entry });
    assert.deepEqual(context.query.mock.calls[0]?.arguments[1], [
      "user-1",
      process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "",
      entry.email,
    ]);
  });

  test("rejects an invalid email before querying", async () => {
    const context = createMockContext(null);
    const caller = createRouterClient(waitlistRouter, { context });
    await assert.rejects(caller.join({ email: "invalid" }), { code: "BAD_REQUEST" });
    assert.equal(context.query.mock.callCount(), 0);
  });
});
