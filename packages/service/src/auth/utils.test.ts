import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { APIError } from "better-auth/api";

import { isSlugCollision } from "./utils";

describe("isSlugCollision", () => {
  test("matches a better-auth slug-taken APIError", () => {
    const error = new APIError("BAD_REQUEST", { message: "Organization slug already taken" });
    assert.strictEqual(isSlugCollision(error), true);
  });

  test("matches a Postgres unique violation (23505)", () => {
    assert.strictEqual(isSlugCollision({ code: "23505" }), true);
  });

  test("does not match an unrelated APIError", () => {
    const error = new APIError("BAD_REQUEST", { message: "You are not a member" });
    assert.strictEqual(isSlugCollision(error), false);
  });

  test("does not match a generic error or non-object", () => {
    assert.strictEqual(isSlugCollision(new Error("network down")), false);
    assert.strictEqual(isSlugCollision({ code: "08006" }), false);
    assert.strictEqual(isSlugCollision(null), false);
    // oxlint-disable-next-line unicorn/no-useless-undefined -- the explicit undefined is the value under test
    assert.strictEqual(isSlugCollision(undefined), false);
  });
});
