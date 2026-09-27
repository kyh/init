import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { NextRequest } from "next/server";

import { generateOpenAPIDocument } from "@/orpc/openapi";

import { GET, POST } from "./route";

/** Requests carry no session cookie, so they stop before any database query. */

const APP_ORIGIN = "http://localhost:3000";

const rest = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(`${APP_ORIGIN}/api/v1${path}`, {
    body: JSON.stringify({ slug: "acme" }),
    headers: { "content-type": "application/json", ...headers },
    method: "POST",
  });

describe("rest endpoint", () => {
  test("answers an unauthenticated call with a JSON error", async () => {
    const response = await POST(rest("/todo/list"));

    assert.strictEqual(response.status, 401);
    assert.match(response.headers.get("content-type") ?? "", /json/u);
    const body = await response.json();
    assert.strictEqual(body.code, "UNAUTHORIZED");
  });

  test("refuses a cross-origin POST with a JSON error", async () => {
    const response = await POST(rest("/todo/list", { origin: "http://evil.localhost:3000" }));

    assert.strictEqual(response.status, 403);
    const body = await response.json();
    assert.strictEqual(body.code, "FORBIDDEN");
  });

  test("answers an unknown procedure with a JSON 404", async () => {
    const response = await GET(new NextRequest(`${APP_ORIGIN}/api/v1/nope`));

    assert.strictEqual(response.status, 404);
    const body = await response.json();
    assert.strictEqual(body.code, "NOT_FOUND");
  });
});

describe("openapi document", () => {
  test("describes every procedure under the REST prefix", async () => {
    const document = await generateOpenAPIDocument();

    assert.ok(document.servers?.[0]?.url.endsWith("/api/v1"));
    const paths: `/${string}`[] = [
      "/todo/list",
      "/todo/create",
      "/waitlist/join",
      "/organization/get",
    ];
    for (const path of paths) {
      assert.ok(document.paths?.[path], `missing ${path}`);
    }
  });
});
