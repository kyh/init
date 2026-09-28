import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { prefersMarkdown } from "./accept";

describe("prefersMarkdown", () => {
  test("serves markdown when the client asks for it", () => {
    assert.equal(prefersMarkdown("text/markdown"), true);
    assert.equal(prefersMarkdown("TEXT/MARKDOWN; charset=utf-8"), true);
    assert.equal(prefersMarkdown("text/markdown, text/html;q=0.9"), true);
    assert.equal(prefersMarkdown("text/markdown, text/html"), true);
  });

  test("keeps browsers and wildcards on HTML", () => {
    assert.equal(prefersMarkdown(null), false);
    assert.equal(prefersMarkdown("*/*"), false);
    assert.equal(
      prefersMarkdown("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"),
      false,
    );
  });

  test("ranks by q-value", () => {
    assert.equal(prefersMarkdown("text/markdown;q=0.5, text/html"), false);
    assert.equal(prefersMarkdown("text/html;q=0.5, text/markdown;q=0.9"), true);
  });

  test("needs markdown named explicitly, not reached through a wildcard", () => {
    assert.equal(prefersMarkdown("text/markdown;q=0, */*"), false);
    assert.equal(prefersMarkdown("text/html;q=0, text/*"), false);
    assert.equal(prefersMarkdown("text/html;q=0, text/markdown"), true);
  });
});
