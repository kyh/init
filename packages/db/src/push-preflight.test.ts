import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { definedTables, foreignTables } from "./push-preflight";

describe("definedTables", () => {
  test("collects every table the schema declares", () => {
    const defined = definedTables();
    for (const name of ["waitlist", "todo", "user", "session", "account", "rate_limit"]) {
      assert.equal(defined.has(name), true, `expected ${name}`);
    }
  });

  test("collects only tables", () => {
    assert.equal(definedTables().has("waitlistRelations"), false);
  });
});

describe("foreignTables", () => {
  test("passes a target holding only this schema's tables", () => {
    const defined = definedTables();
    assert.deepEqual(foreignTables([...defined], defined), []);
  });

  test("passes an empty target", () => {
    assert.deepEqual(foreignTables([], definedTables()), []);
  });

  test("flags another app's tables", () => {
    assert.deepEqual(
      foreignTables(["waitlist", "search_results", "user", "search_queries"], definedTables()),
      ["search_queries", "search_results"],
    );
  });

  test("ignores tables the target is missing", () => {
    assert.deepEqual(foreignTables(["waitlist"], definedTables()), []);
  });
});
