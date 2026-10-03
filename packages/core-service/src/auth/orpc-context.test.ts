import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { mockSession } from "../test-utils";
import { createORPCContext } from "../orpc";
import { auth } from "./auth";

describe("createORPCContext", () => {
  test("resolves the session itself when none is supplied", async (t) => {
    const spy = t.mock.method(auth.api, "getSession", () => Promise.resolve(mockSession));

    const ctx = await createORPCContext({ headers: new Headers() });

    assert.strictEqual(ctx.session, mockSession);
    assert.strictEqual(spy.mock.callCount(), 1);
  });

  test("reuses a supplied session instead of looking it up again", async (t) => {
    const spy = t.mock.method(auth.api, "getSession");

    const ctx = await createORPCContext({ headers: new Headers(), session: mockSession });

    assert.strictEqual(ctx.session, mockSession);
    assert.strictEqual(spy.mock.callCount(), 0);
  });

  test("treats a supplied null as resolved-and-logged-out, not as absent", async (t) => {
    const spy = t.mock.method(auth.api, "getSession");

    const ctx = await createORPCContext({ headers: new Headers(), session: null });

    assert.strictEqual(ctx.session, null);
    assert.strictEqual(spy.mock.callCount(), 0);
  });
});
