import assert from "node:assert/strict";
import { describe, mock, test } from "node:test";

import { mockSession } from "../test-utils";
import { createTRPCContext } from "../trpc";
import { auth } from "./auth";

const headers = () => new Headers();

describe("createTRPCContext", () => {
  test("resolves the session itself when none is supplied", async () => {
    const spy = mock.method(auth.api, "getSession", () => Promise.resolve(mockSession));

    const ctx = await createTRPCContext({ headers: headers() });

    assert.strictEqual(ctx.session, mockSession);
    assert.strictEqual(spy.mock.callCount(), 1);
    spy.mock.restore();
  });

  test("reuses a supplied session instead of looking it up again", async () => {
    const spy = mock.method(auth.api, "getSession");

    const ctx = await createTRPCContext({ headers: headers(), session: mockSession });

    assert.strictEqual(ctx.session, mockSession);
    assert.strictEqual(spy.mock.callCount(), 0);
    spy.mock.restore();
  });

  test("treats a supplied null as resolved-and-logged-out, not as absent", async () => {
    const spy = mock.method(auth.api, "getSession");

    const ctx = await createTRPCContext({ headers: headers(), session: null });

    assert.strictEqual(ctx.session, null);
    assert.strictEqual(spy.mock.callCount(), 0);
    spy.mock.restore();
  });
});
