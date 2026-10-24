import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { pageMetadata } from "./page-metadata";
import { siteConfig } from "./site-config";

describe("pageMetadata", () => {
  test("sets the canonical, og:url and both share cards from one path", () => {
    const metadata = pageMetadata({ description: "About it.", path: "/about", title: "About" });

    assert.deepEqual(metadata.alternates, { canonical: "/about" });
    assert.equal(metadata.title, "About");
    assert.ok(metadata.openGraph);
    assert.equal(metadata.openGraph.url, "/about");
    assert.equal(metadata.openGraph.title, "About");
    assert.ok(metadata.twitter);
    assert.equal(metadata.twitter.title, "About");
  });

  test("every image carries its size and alt text", () => {
    const metadata = pageMetadata({
      description: "Queries.",
      image: { alt: "Queries card", url: "/og/docs/build/queries/image.png" },
      path: "/docs/build/queries",
      title: "Queries",
      type: "article",
    });

    assert.deepEqual(metadata.openGraph?.images, [
      { alt: "Queries card", height: 630, url: "/og/docs/build/queries/image.png", width: 1200 },
    ]);
  });

  test("attaches the og:video only when asked", () => {
    const withVideo = pageMetadata({ description: "Home.", path: "/", video: true });
    const withoutVideo = pageMetadata({ description: "Docs.", path: "/docs", title: "Docs" });

    assert.ok(withVideo.openGraph && "videos" in withVideo.openGraph);
    assert.deepEqual(withVideo.openGraph.videos, [
      {
        height: 630,
        secureUrl: `${siteConfig.url}/og/og.mp4`,
        type: "video/mp4",
        url: `${siteConfig.url}/og/og.mp4`,
        width: 1200,
      },
    ]);
    assert.ok(withoutVideo.openGraph);
    assert.equal("videos" in withoutVideo.openGraph, false);
  });

  test("the home page keeps the layout's default title", () => {
    assert.equal("title" in pageMetadata({ description: "Home.", path: "/" }), false);
  });
});
