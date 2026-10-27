import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  buildDocGraph,
  buildHomeGraph,
  buildOrganization,
  buildVideoObject,
  serializeJsonLd,
} from "./structured-data";

describe("buildOrganization", () => {
  const organization = buildOrganization();

  test("carries a description, contact point and profiles", () => {
    assert.ok(organization.description.length > 0);
    assert.equal(organization.contactPoint.email, "kai@kyh.io");
    assert.ok(organization.sameAs.includes("https://github.com/kyh/init"));
  });

  test("invents no postal address or phone", () => {
    assert.equal("address" in organization, false);
    assert.equal("telephone" in organization, false);
  });
});

describe("buildHomeGraph", () => {
  test("points every other node back at the organization", () => {
    const graph = buildHomeGraph()["@graph"];
    const others = graph.filter((node) => node["@type"] !== "Organization");

    assert.equal(others.length, 3);
    for (const node of others) {
      assert.ok("publisher" in node);
      assert.deepEqual(node.publisher, { "@id": buildOrganization()["@id"] });
    }
  });
});

describe("buildVideoObject", () => {
  test("carries absolute URLs, an ISO 8601 duration and the clip's size", () => {
    const video = buildVideoObject();
    assert.match(video.contentUrl, /^https?:\/\/.+\.mp4$/u);
    assert.match(video.thumbnailUrl, /^https?:\/\//u);
    assert.match(video.duration, /^PT\d+(?:\.\d+)?S$/u);
    assert.match(video.uploadDate, /^\d{4}-\d{2}-\d{2}$/u);
    assert.deepEqual([video.width, video.height], [1200, 630]);
  });
});

describe("buildDocGraph", () => {
  const lastModified = new Date("2026-01-02T03:04:05.000Z");
  const [article, breadcrumb] = buildDocGraph({
    description: "How queries work.",
    image: "/og/docs/build/queries/image.png",
    lastModified,
    path: "/docs/build/queries",
    title: "Queries",
  })["@graph"];

  test("describes the page as a TechArticle with absolute URLs", () => {
    assert.equal(article?.["@type"], "TechArticle");
    assert.equal(article?.headline, "Queries");
    assert.equal(article?.dateModified, lastModified.toISOString());
    assert.match(String(article?.url), /^https?:\/\/.+\/docs\/build\/queries$/u);
    assert.match(String(article?.image), /^https?:\/\/.+\/image\.png$/u);
  });

  test("breadcrumbs run Home, Documentation, page", () => {
    const items = breadcrumb?.itemListElement ?? [];
    assert.equal(breadcrumb?.["@type"], "BreadcrumbList");
    assert.deepEqual(
      items.map((item) => item.name),
      ["Init", "Documentation", "Queries"],
    );
    assert.deepEqual(
      items.map((item) => item.position),
      [1, 2, 3],
    );
  });

  test("the docs index stops at Documentation", () => {
    const [, indexCrumbs] = buildDocGraph({
      image: "/og/docs/image.png",
      lastModified: new Date("2026-01-02T00:00:00.000Z"),
      path: "/docs",
      title: "Introduction",
    })["@graph"];
    assert.equal(indexCrumbs?.itemListElement?.length, 2);
  });
});

describe("serializeJsonLd", () => {
  test("escapes `<` so a value cannot close the script tag", () => {
    assert.equal(serializeJsonLd({ name: "</script>" }), '{"name":"\\u003c/script>"}');
  });
});
