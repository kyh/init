import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { APIError } from "better-auth/api";

import { isSlugCollision, slugify, zJsonString } from "./utils";

describe("slugify", () => {
  test("lowercases and replaces spaces with hyphens", () => {
    assert.strictEqual(slugify("Hello World"), "hello-world");
  });

  test("trims leading and trailing whitespace", () => {
    assert.strictEqual(slugify("  hello  "), "hello");
  });

  test("removes special characters", () => {
    assert.strictEqual(slugify("hello@world!"), "helloworld");
  });

  test("collapses multiple hyphens into one", () => {
    assert.strictEqual(slugify("hello---world"), "hello-world");
  });

  test("handles mixed spaces, hyphens, and special chars", () => {
    assert.strictEqual(slugify("  My Cool -- Project!  "), "my-cool-project");
  });

  test("returns empty string for empty input", () => {
    assert.strictEqual(slugify(""), "");
  });

  test("keeps the base letter when stripping diacritics", () => {
    assert.strictEqual(slugify("café latte"), "cafe-latte");
    assert.strictEqual(slugify("José Müller"), "jose-muller");
  });

  test("returns empty string for scripts with no ascii base", () => {
    assert.strictEqual(slugify("李明"), "");
    assert.strictEqual(slugify("Иван"), "");
  });

  test("does not leave leading or trailing hyphens", () => {
    assert.strictEqual(slugify("!hello!"), "hello");
    assert.strictEqual(slugify("-hello-"), "hello");
  });

  test("preserves numbers", () => {
    assert.strictEqual(slugify("Project 123"), "project-123");
  });
});

describe("zJsonString", () => {
  test("parses valid JSON string", () => {
    const result = zJsonString.parse('{"key": "value"}');
    assert.deepEqual(result, { key: "value" });
  });

  test("parses JSON arrays", () => {
    const result = zJsonString.parse("[1, 2, 3]");
    assert.deepEqual(result, [1, 2, 3]);
  });

  test("parses JSON primitives", () => {
    assert.strictEqual(zJsonString.parse('"hello"'), "hello");
    assert.strictEqual(zJsonString.parse("42"), 42);
    assert.strictEqual(zJsonString.parse("true"), true);
    assert.strictEqual(zJsonString.parse("null"), null);
  });

  test("rejects invalid JSON", () => {
    const result = zJsonString.safeParse("{invalid}");
    assert.strictEqual(result.success, false);
  });

  test("rejects non-string input", () => {
    const result = zJsonString.safeParse(123);
    assert.strictEqual(result.success, false);
  });
});

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
    assert.strictEqual(isSlugCollision(undefined), false);
  });
});
