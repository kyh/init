import { describe, expect, it } from "vitest";

import { flagDefaults, parseFlags, resolveFlags } from "./flags";

describe("parseFlags", () => {
  it("reads a bare name as enabled", () => {
    expect(parseFlags("exampleNewFeature").overrides).toEqual({ exampleNewFeature: true });
  });

  it("reads an explicit value", () => {
    expect(parseFlags("exampleNewFeature=true").overrides).toEqual({ exampleNewFeature: true });
    expect(parseFlags("exampleNewFeature=false").overrides).toEqual({ exampleNewFeature: false });
  });

  it("only `true` enables — a stray value cannot turn a flag on by accident", () => {
    expect(parseFlags("exampleNewFeature=1").overrides).toEqual({ exampleNewFeature: false });
    expect(parseFlags("exampleNewFeature=yes").overrides).toEqual({ exampleNewFeature: false });
  });

  it("tolerates whitespace and empty entries", () => {
    expect(parseFlags("  exampleNewFeature = true , ,").overrides).toEqual({
      exampleNewFeature: true,
    });
  });

  it("reports unknown names instead of silently dropping them", () => {
    const { overrides, unknown } = parseFlags("exampleNewFeature,nosuchflag");

    expect(overrides).toEqual({ exampleNewFeature: true });
    expect(unknown).toEqual(["nosuchflag"]);
  });

  it("returns nothing for an unset variable", () => {
    expect(parseFlags(undefined)).toEqual({ overrides: {}, unknown: [] });
    expect(parseFlags("")).toEqual({ overrides: {}, unknown: [] });
  });
});

describe("resolveFlags", () => {
  it("falls back to the registry defaults", () => {
    expect(resolveFlags(undefined)).toEqual(flagDefaults);
  });

  it("layers overrides over the defaults, leaving untouched flags alone", () => {
    const resolved = resolveFlags("exampleNewFeature");

    expect(resolved.exampleNewFeature).toBe(true);
    expect(Object.keys(resolved).toSorted()).toEqual(Object.keys(flagDefaults).toSorted());
  });

  it("ignores an unknown name rather than adding it to the set", () => {
    expect(resolveFlags("nosuchflag")).toEqual(flagDefaults);
  });
});
