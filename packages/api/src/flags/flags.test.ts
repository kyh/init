import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { flagDefaults, parseFlags, resolveFlags } from "./flags";

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

describe("resolveFlags", () => {
  test("falls back to the registry defaults", () => {
    assert.deepEqual(resolveFlags(), flagDefaults);
  });

  test("layers overrides over the defaults without adding keys", () => {
    const resolved = resolveFlags("exampleNewFeature");

    assert.equal(resolved.exampleNewFeature, true);
    assert.deepEqual(Object.keys(resolved).toSorted(), Object.keys(flagDefaults).toSorted());
  });

  test("ignores an unknown name rather than adding it to the set", () => {
    assert.deepEqual(resolveFlags("nosuchflag"), flagDefaults);
  });
});
