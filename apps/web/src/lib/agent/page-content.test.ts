import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { headingId, p, section, sectionIndex, sectionLink, strong } from "./page-content";

describe("headingId", () => {
  test("slugs a heading the way GitHub slugs Markdown headings", () => {
    assert.equal(headingId("Personal information we collect"), "personal-information-we-collect");
    assert.equal(headingId("Tracking & Other Technologies"), "tracking--other-technologies");
    assert.equal(headingId("1. Accounts"), "1-accounts");
    assert.equal(
      headingId("5. Third-Party Services & Other Users"),
      "5-third-party-services--other-users",
    );
  });
});

describe("section links", () => {
  test("point at the anchor of the heading they name", () => {
    assert.deepEqual(sectionLink("Your choices"), {
      href: "#your-choices",
      kind: "link",
      text: "Your choices",
    });
  });

  test("index each section in order", () => {
    const index = sectionIndex([section("First", p("One.")), section("Second & last")]);
    assert.deepEqual(
      index.items.map((entry) => entry.content),
      [[sectionLink("First")], [sectionLink("Second & last")]],
    );
  });
});

describe("p", () => {
  test("treats strings as plain text and keeps bold runs", () => {
    assert.deepEqual(p(strong("Lead."), " Body.").content, [
      { kind: "strong", text: "Lead." },
      { kind: "text", text: " Body." },
    ]);
  });
});
