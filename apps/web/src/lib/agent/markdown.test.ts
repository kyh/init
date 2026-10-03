import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { renderHomeMarkdown, renderNotFoundMarkdown, renderSitePageMarkdown } from "./markdown";
import {
  bullets,
  item,
  itemWithList,
  link,
  list,
  p,
  section,
  strong,
  subheading,
  table,
} from "./page-content";
import { privacy } from "./privacy-policy";
import { servedPages, sitePages } from "./site-pages";
import { terms } from "./terms-of-use";

describe("renderHomeMarkdown", () => {
  test("starts with the product name and links the discovery surfaces", () => {
    const body = renderHomeMarkdown();
    assert.equal(body.split("\n")[0], "# Init");
    for (const path of ["/llms.txt", "/sitemap.xml", "/openapi.json", "/about", "/privacy"]) {
      assert.ok(body.includes(`${path})`), `should link ${path}`);
    }
  });
});

describe("renderNotFoundMarkdown", () => {
  test("names the missing path and points at recovery links", () => {
    const body = renderNotFoundMarkdown("/nope");
    assert.ok(body.startsWith("# 404"));
    assert.ok(body.includes("`/nope`"));
    assert.ok(body.includes("/llms.txt)"));
    assert.ok(body.includes("/sitemap.xml)"));
  });
});

describe("renderSitePageMarkdown", () => {
  test("renders every block type, then the footnote after a rule", () => {
    const body = renderSitePageMarkdown({
      description: "A page with one of everything.",
      footnote: "A closing credit.",
      path: "/sample",
      preamble: [p("Before the first section.")],
      sections: [
        section(
          "First section",
          p(strong("Lead."), " Text with a ", link("link", "#first-section"), "."),
          subheading("A subheading"),
          list(itemWithList([strong("Parent")], [item("Child")]), item("Sibling")),
          p("Between the lists."),
          bullets("One", "Two"),
          table("Sample table", ["Name", "Value"], [["a|b", "c"]]),
        ),
      ],
      title: "Sample",
    });

    assert.equal(
      body,
      [
        "# Sample",
        "",
        "> A page with one of everything.",
        "",
        "Before the first section.",
        "",
        "## First section",
        "",
        "**Lead.** Text with a [link](#first-section).",
        "",
        "### A subheading",
        "",
        "- **Parent**",
        "  - Child",
        "- Sibling",
        "",
        "Between the lists.",
        "",
        "- One",
        "- Two",
        "",
        "| Name | Value |",
        "| --- | --- |",
        String.raw`| a\|b | c |`,
        "",
        "---",
        "",
        "A closing credit.",
        "",
      ].join("\n"),
    );
  });

  test("renders the legal pages' tables as GFM tables", () => {
    const body = renderSitePageMarkdown(privacy);
    assert.ok(body.includes("\n| --- | --- | --- | --- | --- |\n"), "CCPA chart");
    assert.ok(body.includes("\n| --- | --- | --- |\n"), "GDPR legal bases table");
  });

  test("ends each legal page with its template credit", () => {
    for (const page of [privacy, terms]) {
      const body = renderSitePageMarkdown(page);
      assert.ok(body.endsWith(`\n---\n\n${page.footnote ?? "<no footnote>"}\n`), page.path);
    }
  });
});

describe("site pages", () => {
  test("each carries enough content to be a trust anchor", () => {
    for (const page of servedPages) {
      const body = renderSitePageMarkdown(page);
      assert.ok(body.length > 600, `${page.path} is ${body.length} chars`);
      assert.ok(body.startsWith(`# ${page.title}\n`));
    }
  });

  test("contact lists the email and the GitHub issues", () => {
    const contact = sitePages.find((page) => page.path === "/contact");
    const body = contact ? renderSitePageMarkdown(contact) : "";
    assert.ok(body.includes("kai@kyh.io"));
    assert.ok(body.includes("github.com/kyh/init/issues"));
  });
});
