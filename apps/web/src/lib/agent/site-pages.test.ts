import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { siteConfig } from "@/lib/site-config";

import { renderSitePageMarkdown } from "./markdown";
import type { Block, Inline, LinkRun, ListItem, SitePage } from "./page-content";
import { GENERAL_LEGAL_CREDIT, headingId } from "./page-content";
import { privacy } from "./privacy-policy";
import { findSitePage, sitePages } from "./site-pages";
import { terms } from "./terms-of-use";

const itemRuns = (items: ListItem[]): Inline[] =>
  items.flatMap((entry) => [...entry.content, ...itemRuns(entry.items)]);

const blockRuns = (block: Block): Inline[] => {
  switch (block.kind) {
    case "paragraph": {
      return block.content;
    }
    case "list": {
      return itemRuns(block.items);
    }
    case "subheading": {
      return [{ kind: "text", text: block.text }];
    }
    default: {
      return [...block.columns, ...block.rows.flat()].map((text) => ({ kind: "text", text }));
    }
  }
};

/** Every run of text on a page: headings, paragraphs, list items and table cells. */
const pageRuns = (page: SitePage): Inline[] => [
  ...(page.preamble ?? []).flatMap(blockRuns),
  ...page.sections.flatMap((section) => [
    { kind: "text" as const, text: section.heading },
    ...section.blocks.flatMap(blockRuns),
  ]),
];

const isLink = (run: Inline): run is LinkRun => run.kind === "link";

const linksOf = (page: SitePage) => pageRuns(page).filter(isLink);

const sectionIds = (page: SitePage) => page.sections.map((section) => headingId(section.heading));

const legalPages = [privacy, terms];

describe("site page registry", () => {
  test("lists each page once and finds the legal pages by path", () => {
    const paths = sitePages.map((page) => page.path);
    assert.deepEqual(paths, ["/about", "/contact", "/privacy", "/terms"]);
    assert.equal(findSitePage("/privacy"), privacy);
    assert.equal(findSitePage("/terms"), terms);
  });
});

describe("privacy policy", () => {
  test("keeps the template's sections, in order", () => {
    assert.deepEqual(
      privacy.sections.map((section) => section.heading),
      [
        "Personal information we collect",
        "Tracking & Other Technologies",
        "How we use your personal information",
        "Retention",
        "How we share your personal information",
        "Your choices",
        "Other sites and services",
        "Security",
        "International data transfer",
        "Children",
        "Changes to this Privacy Policy",
        "How to contact us",
        "State privacy rights notice",
        "Notice to European users",
      ],
    );
  });

  test("indexes every section, in order, by its anchor", () => {
    const anchors = (privacy.preamble ?? [])
      .flatMap(blockRuns)
      .filter(isLink)
      .map((run) => run.href)
      .filter((href) => href.startsWith("#"));
    const index = anchors.slice(-privacy.sections.length);
    assert.deepEqual(
      index,
      sectionIds(privacy).map((id) => `#${id}`),
    );
  });

  test("links its own history on GitHub, from the file that holds its text", () => {
    const history = linksOf(privacy).find((run) => run.text === "history on GitHub");
    const [, path] = history?.href.split(`${siteConfig.repository}/commits/main/`) ?? [];
    assert.ok(path, "history link");
    assert.ok(fileURLToPath(new URL("privacy-policy.ts", import.meta.url)).endsWith(path));
  });

  test("gives every row of its tables a cell per column, and sells or shares nothing", () => {
    const tables = privacy.sections
      .flatMap((section) => section.blocks)
      .filter((block) => block.kind === "table");
    assert.deepEqual(
      tables.map((block) => block.columns.length),
      [5, 3],
    );
    for (const block of tables) {
      for (const row of block.rows) {
        assert.equal(row.length, block.columns.length, row.join(" | "));
      }
    }
    const [ccpa] = tables;
    assert.ok(ccpa?.rows.every((row) => row.at(-1) === "None"));
  });
});

describe("terms of use", () => {
  test("keeps the template's numbered sections", () => {
    assert.deepEqual(
      terms.sections.map((section) => section.heading),
      [
        "1. Accounts",
        "2. Access to the Site",
        "3. Privacy",
        "4. Indemnification",
        "5. Third-Party Services & Other Users",
        "6. Disclaimers",
        "7. Limitation of Liability",
        "8. Term and Termination",
        "9. State-Specific Legal Notices",
        "10. General",
        "11. Dispute Resolution",
      ],
    );
  });

  test("links the privacy policy", () => {
    assert.ok(linksOf(terms).some((run) => run.href === `${siteConfig.url}/privacy`));
  });
});

describe("legal pages", () => {
  test("link only to anchors that exist", () => {
    for (const page of legalPages) {
      for (const { href } of linksOf(page)) {
        const [target, anchor] = href.split("#");
        if (anchor === undefined) {
          continue;
        }
        const ids = target === `${siteConfig.url}/privacy` ? sectionIds(privacy) : sectionIds(page);
        assert.ok(ids.includes(anchor), `${page.path} links to missing #${anchor}`);
      }
    }
  });

  test("are dated, give the contact email and end with the template credit", () => {
    for (const page of legalPages) {
      const body = renderSitePageMarkdown(page);
      assert.ok(body.includes("October 3, 2026"), page.path);
      assert.ok(body.includes(`mailto:${siteConfig.email}`), page.path);
      assert.equal(page.footnote, GENERAL_LEGAL_CREDIT);
    }
  });

  test("leave no template placeholder or drafting note behind", () => {
    for (const page of legalPages) {
      for (const { text } of pageRuns(page)) {
        assert.doesNotMatch(text, /[[\]]|<mark>|INSERT|\{\{|\bCompany\b|DecisionLayer/u, text);
      }
    }
  });
});
