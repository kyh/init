import assert from "node:assert/strict";
import { test } from "node:test";

import { safeNextPath } from "./next-path";

test("preserves internal destinations, query parameters and fragments", () => {
  assert.equal(
    safeNextPath("/dashboard/acme?tab=members#invite"),
    "/dashboard/acme?tab=members#invite",
  );
  assert.equal(safeNextPath("/auth/invitation/123"), "/auth/invitation/123");
});

test("rejects external redirects after browser URL normalization", () => {
  for (const path of [
    undefined,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\n/evil.example",
    "/\t/evil.example",
  ]) {
    assert.equal(safeNextPath(path), "/dashboard", `Unsafe destination: ${JSON.stringify(path)}`);
  }
});
