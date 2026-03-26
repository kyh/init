import { describe, expect, it } from "vitest";

import { authMetadataSchema } from "./auth-schema";

describe("authMetadataSchema", () => {
  it("parses valid metadata with personal flag", () => {
    const result = authMetadataSchema.parse('{"personal": true}');
    expect(result).toEqual({ personal: true });
  });

  it("parses metadata without personal flag", () => {
    const result = authMetadataSchema.parse("{}");
    expect(result).toEqual({});
  });

  it("rejects invalid JSON", () => {
    const result = authMetadataSchema.safeParse("not-json");
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean personal field", () => {
    const result = authMetadataSchema.safeParse('{"personal": "yes"}');
    expect(result.success).toBe(false);
  });

  it("strips unknown fields", () => {
    const result = authMetadataSchema.parse('{"personal": false, "extra": 1}');
    expect(result).toEqual({ personal: false });
  });
});
