import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildHomeGraph, buildOrganization, serializeJsonLd } from "./structured-data";

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

    assert.equal(others.length, 2);
    for (const node of others) {
      assert.ok("publisher" in node);
      assert.deepEqual(node.publisher, { "@id": buildOrganization()["@id"] });
    }
  });
});

describe("serializeJsonLd", () => {
  test("escapes `<` so a value cannot close the script tag", () => {
    assert.equal(serializeJsonLd({ name: "</script>" }), '{"name":"\\u003c/script>"}');
  });
});
