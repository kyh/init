import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { renderHomeMarkdown, renderNotFoundMarkdown, renderSitePageMarkdown } from "./markdown";
import { sitePages } from "./site-pages";

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

describe("site pages", () => {
  test("each carries enough content to be a trust anchor", () => {
    for (const page of sitePages) {
      const body = renderSitePageMarkdown(page);
      assert.ok(body.length > 600, `${page.path} is ${body.length} chars`);
      assert.ok(body.startsWith(`# ${page.title}\n`));
    }
  });

  test("contact lists the email and the GitHub issues", () => {
    const contact = sitePages.find((page) => page.path === "/contact");
    const body = contact ? renderSitePageMarkdown(contact) : "";
    assert.ok(body.includes("im.kaiyu@gmail.com"));
    assert.ok(body.includes("github.com/kyh/init/issues"));
  });
});
