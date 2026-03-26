import { describe, expect, it } from "vitest";

import { cn, formatDate } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates tailwind conflicts", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("handles undefined and null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("returns empty string for no args", () => {
    expect(cn()).toBe("");
  });
});

describe("formatDate", () => {
  it("formats a Date object with defaults", () => {
    const result = formatDate(new Date(2024, 0, 15));
    expect(result).toContain("January");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("formats a date string", () => {
    const result = formatDate(new Date(2024, 5, 1));
    expect(result).toContain("June");
    expect(result).toContain("2024");
  });

  it("formats a timestamp number", () => {
    const result = formatDate(new Date(2024, 11, 25));
    expect(result).toContain("December");
    expect(result).toContain("2024");
  });

  it("respects custom options", () => {
    const result = formatDate(new Date("2024-01-15"), {
      month: "short",
      day: "2-digit",
    });
    expect(result).toContain("Jan");
  });
});
