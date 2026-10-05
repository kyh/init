import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { renderLlmsTxt } from "./llms-txt";

const body = renderLlmsTxt([{ title: "Introduction", url: "/docs/overview/introduction" }]);

describe("renderLlmsTxt — llmstxt.org format", () => {
  test("opens with one H1 and a blockquote summary", () => {
    const lines = body.split("\n");
    assert.equal(lines[0], "# Init");
    assert.equal(lines[2]?.startsWith("> "), true);
    assert.equal(lines.filter((line) => line.startsWith("# ")).length, 1);
  });

  test("puts when-to-use guidance before the first H2", () => {
    const prose = body.slice(0, body.indexOf("\n## "));
    assert.match(prose, /\*\*When to use Init:\*\*/u);
    assert.match(prose, /\*\*Not a fit:\*\*/u);
  });

  test("keeps every H2 section a link list", () => {
    for (const section of body.split(/^## /mu).slice(1)) {
      const items = section
        .split("\n")
        .slice(1)
        .filter((line) => line.trim().length > 0);
      assert.ok(items.length > 0);
      for (const item of items) {
        assert.ok(item.startsWith("- ["), item);
      }
    }
  });

  test("lists docs as absolute links", () => {
    assert.ok(body.includes("- [Introduction](http://localhost:3000/docs/overview/introduction)"));
  });

  test("lists every trust page, the legal pages included", () => {
    for (const path of ["/about", "/contact", "/privacy", "/terms"]) {
      assert.ok(body.includes(`](http://localhost:3000${path})`), path);
    }
  });
});
