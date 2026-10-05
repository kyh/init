import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { authMetadataSchema } from "./auth-schema";

describe("authMetadataSchema", () => {
  test("parses valid metadata with personal flag", () => {
    const result = authMetadataSchema.parse('{"personal": true}');
    assert.deepEqual(result, { personal: true });
  });

  test("parses metadata without personal flag", () => {
    const result = authMetadataSchema.parse("{}");
    assert.deepEqual(result, {});
  });

  test("rejects invalid JSON", () => {
    const result = authMetadataSchema.safeParse("not-json");
    assert.strictEqual(result.success, false);
  });

  test("rejects non-boolean personal field", () => {
    const result = authMetadataSchema.safeParse('{"personal": "yes"}');
    assert.strictEqual(result.success, false);
  });

  test("strips unknown fields", () => {
    const result = authMetadataSchema.parse('{"personal": false, "extra": 1}');
    assert.deepEqual(result, { personal: false });
  });
});
