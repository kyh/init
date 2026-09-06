import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { NextRequest } from "next/server";

import { GET, POST } from "./route";

/** Exercise the exported route: origin enforcement, GET refusal and no credentialed CORS.
 * Requests have no session cookie, so they stop before any database query. */

const APP_ORIGIN = "http://localhost:3000";

const rpc = (headers: Record<string, string>) =>
  new NextRequest(`${APP_ORIGIN}/api/orpc/todo/list`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ json: { slug: "acme" } }),
  });

describe("rpc endpoint", () => {
  test("refuses a POST whose Origin is another origin, even a same-site one", async () => {
    const response = await POST(rpc({ origin: "http://evil.localhost:3000" }));

    assert.strictEqual(response.status, 403);
  });

  test("refuses a POST from another port on the same host", async () => {
    const response = await POST(rpc({ origin: "http://localhost:3398" }));

    assert.strictEqual(response.status, 403);
  });

  test("allows a POST whose Origin is the app itself", async () => {
    const response = await POST(rpc({ origin: APP_ORIGIN }));

    assert.strictEqual(response.status, 401);
    assert.match(await response.text(), /UNAUTHORIZED/);
  });

  test("allows a POST with no Origin at all, so the mobile client still reaches it", async () => {
    const response = await POST(rpc({}));

    assert.strictEqual(response.status, 401);
    assert.match(await response.text(), /UNAUTHORIZED/);
  });

  test("refuses GET, so a cross-site navigation cannot invoke a procedure", async () => {
    // RPC’s default allowMethods excludes GET, leaving the route unmatched.
    const response = await GET(new NextRequest(`${APP_ORIGIN}/api/orpc/todo/list`));

    assert.strictEqual(response.status, 404);
  });

  test("serves no CORS headers, so a credentialed cross-origin fetch cannot read it", async () => {
    const response = await POST(rpc({}));

    assert.strictEqual(response.headers.get("access-control-allow-origin"), null);
  });
});
