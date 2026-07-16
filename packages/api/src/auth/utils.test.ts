import { APIError } from "better-auth/api";
import { describe, expect, it } from "vitest";

import { isSlugCollision, slugify, zJsonString } from "./utils";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("trims leading and trailing whitespace", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });

  it("removes special characters", () => {
    expect(slugify("hello@world!")).toBe("helloworld");
  });

  it("collapses multiple hyphens into one", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });

  it("handles mixed spaces, hyphens, and special chars", () => {
    expect(slugify("  My Cool -- Project!  ")).toBe("my-cool-project");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("keeps the base letter when stripping diacritics", () => {
    expect(slugify("café latte")).toBe("cafe-latte");
    expect(slugify("José Müller")).toBe("jose-muller");
  });

  it("returns empty string for scripts with no ascii base", () => {
    expect(slugify("李明")).toBe("");
    expect(slugify("Иван")).toBe("");
  });

  it("does not leave leading or trailing hyphens", () => {
    expect(slugify("!hello!")).toBe("hello");
    expect(slugify("-hello-")).toBe("hello");
  });

  it("preserves numbers", () => {
    expect(slugify("Project 123")).toBe("project-123");
  });
});

describe("zJsonString", () => {
  it("parses valid JSON string", () => {
    const result = zJsonString.parse('{"key": "value"}');
    expect(result).toEqual({ key: "value" });
  });

  it("parses JSON arrays", () => {
    const result = zJsonString.parse("[1, 2, 3]");
    expect(result).toEqual([1, 2, 3]);
  });

  it("parses JSON primitives", () => {
    expect(zJsonString.parse('"hello"')).toBe("hello");
    expect(zJsonString.parse("42")).toBe(42);
    expect(zJsonString.parse("true")).toBe(true);
    expect(zJsonString.parse("null")).toBe(null);
  });

  it("rejects invalid JSON", () => {
    const result = zJsonString.safeParse("{invalid}");
    expect(result.success).toBe(false);
  });

  it("rejects non-string input", () => {
    const result = zJsonString.safeParse(123);
    expect(result.success).toBe(false);
  });
});

describe("isSlugCollision", () => {
  it("matches a better-auth slug-taken APIError", () => {
    const error = new APIError("BAD_REQUEST", { message: "Organization slug already taken" });
    expect(isSlugCollision(error)).toBe(true);
  });

  it("matches a Postgres unique violation (23505)", () => {
    expect(isSlugCollision({ code: "23505" })).toBe(true);
  });

  it("does not match an unrelated APIError", () => {
    const error = new APIError("BAD_REQUEST", { message: "You are not a member" });
    expect(isSlugCollision(error)).toBe(false);
  });

  it("does not match a generic error or non-object", () => {
    expect(isSlugCollision(new Error("network down"))).toBe(false);
    expect(isSlugCollision({ code: "08006" })).toBe(false);
    expect(isSlugCollision(null)).toBe(false);
    expect(isSlugCollision(undefined)).toBe(false);
  });
});
