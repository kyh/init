import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { trustedOrigins } from "./auth/auth";
import { isUntrustedOrigin } from "./origin-guard";

const TRUSTED = trustedOrigins[0] ?? "";

describe("isUntrustedOrigin", () => {
  test("trusts what the browser labels same-origin", () => {
    assert.strictEqual(isUntrustedOrigin(null, "same-origin"), false);
  });

  test("trusts a user-initiated navigation (Sec-Fetch-Site: none)", () => {
    assert.strictEqual(isUntrustedOrigin(null, "none"), false);
  });

  test("trusts an Origin that matches the app", () => {
    assert.strictEqual(isUntrustedOrigin(TRUSTED, null), false);
  });

  test("trusts a non-browser caller with no Origin or Sec-Fetch-Site", () => {
    assert.strictEqual(isUntrustedOrigin(null, null), false);
  });

  test("rejects what the browser labels cross-site", () => {
    assert.strictEqual(isUntrustedOrigin("https://evil.example", "cross-site"), true);
  });

  test("rejects an untrusted Origin when Sec-Fetch-Site is absent", () => {
    assert.strictEqual(isUntrustedOrigin("https://evil.example", null), true);
  });

  test("rejects a cross-site request even if the Origin header is stripped", () => {
    assert.strictEqual(isUntrustedOrigin(null, "cross-site"), true);
  });
});
