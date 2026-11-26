import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { allowedOrigins, classify } from "./navigation";

const pin = (appUrl: string) => allowedOrigins(appUrl);

describe("classify", () => {
  test("allows the app origin on any path", () => {
    assert.equal(
      classify("https://init.kyh.io/dashboard?tab=1", pin("https://init.kyh.io/")),
      "allow",
    );
  });

  test("compares origins, not prefixes", () => {
    const allowed = pin("http://localhost:3000/");
    assert.equal(classify("http://localhost:30001/", allowed), "open-externally");
    assert.equal(classify("https://localhost:3000/", allowed), "open-externally");
  });

  test("allows the OAuth providers and nothing beside them", () => {
    const allowed = pin("https://init.kyh.io/");
    assert.equal(classify("https://github.com/login/oauth/authorize", allowed), "allow");
    assert.equal(classify("https://gist.github.com/", allowed), "open-externally");
  });

  test("allows the emulator only when one is configured", () => {
    const authorize = "http://localhost:4000/login/oauth/authorize";
    assert.equal(classify(authorize, allowedOrigins("http://localhost:3000/")), "open-externally");
    assert.equal(
      classify(authorize, allowedOrigins("http://localhost:3000/", "http://localhost:4000")),
      "allow",
    );
    assert.deepEqual(
      allowedOrigins("http://localhost:3000/", "not a url"),
      allowedOrigins("http://localhost:3000/"),
    );
  });

  test("hands other web pages to the browser and refuses the rest", () => {
    const allowed = pin("https://init.kyh.io/");
    assert.equal(classify("https://example.com/", allowed), "open-externally");
    assert.equal(classify("file:///etc/passwd", allowed), "deny");
    assert.equal(classify("data:text/html,hi", allowed), "deny");
    assert.equal(classify("about:blank", allowed), "deny");
    assert.equal(classify("not a url", allowed), "deny");
  });
});
