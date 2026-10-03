import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { auth } from "./auth";

/** Check resolved cookie attributes, including plugin defaults: RPC relies on SameSite CSRF protection. */
describe("session cookie", () => {
  test("is SameSite Lax or Strict, never None", async () => {
    const { authCookies } = await auth.$context;
    const sameSite = String(authCookies.sessionToken.attributes.sameSite).toLowerCase();

    assert.ok(
      sameSite === "lax" || sameSite === "strict",
      `session cookie sameSite must be lax or strict, got ${sameSite}`,
    );
  });
});
