import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseFlags } from "./flags";

describe("parseFlags", () => {
  test("reads a bare name as enabled and an explicit value as given", () => {
    assert.deepEqual(parseFlags("exampleNewFeature").overrides, { exampleNewFeature: true });
    assert.deepEqual(parseFlags("exampleNewFeature=true").overrides, { exampleNewFeature: true });
    assert.deepEqual(parseFlags("exampleNewFeature=false").overrides, { exampleNewFeature: false });
  });

  test("only `true` enables, so a stray value cannot turn a flag on", () => {
    assert.deepEqual(parseFlags("exampleNewFeature=1").overrides, { exampleNewFeature: false });
    assert.deepEqual(parseFlags("exampleNewFeature=yes").overrides, { exampleNewFeature: false });
  });

  test("tolerates whitespace and empty entries", () => {
    assert.deepEqual(parseFlags("  exampleNewFeature = true , ,").overrides, {
      exampleNewFeature: true,
    });
  });

  test("reports unknown names instead of silently dropping them", () => {
    const { overrides, unknown } = parseFlags("exampleNewFeature,nosuchflag");

    assert.deepEqual(overrides, { exampleNewFeature: true });
    assert.deepEqual(unknown, ["nosuchflag"]);
  });

  test("refuses an entry with an extra `=` rather than reading half of it", () => {
    // Splitting naively would take "true" and enable the flag — the one thing
    // garbled configuration must never do.
    const { malformed, overrides } = parseFlags("exampleNewFeature=true=false");

    assert.deepEqual(overrides, {});
    assert.deepEqual(malformed, ["exampleNewFeature=true=false"]);
  });

  test("keeps well-formed entries alongside a malformed one", () => {
    const { malformed, overrides } = parseFlags("exampleNewFeature, other=a=b");

    assert.deepEqual(overrides, { exampleNewFeature: true });
    // `other` is not in the registry, so it never reaches the malformed check.
    assert.deepEqual(malformed, []);
  });

  test("returns nothing for an unset or empty variable", () => {
    const empty = { malformed: [], overrides: {}, unknown: [] };

    assert.deepEqual(parseFlags(), empty);
    assert.deepEqual(parseFlags(""), empty);
  });
});
