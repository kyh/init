import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { NextRequest } from "next/server";

import { GET, POST } from "./route";

/**
 * This endpoint's cross-site defense is a set of things typecheck cannot see:
 * the session cookie's SameSite=Lax, the handler refusing GET, and the origin
 * check covering what SameSite does not — a same-site *cross-origin* form POST
 * from a sibling subdomain or another port on the same host. Driving the real
 * exported route handler pins the last two, along with the absence of CORS
 * headers; a test that re-derived the predicate would prove nothing about what
 * Next.js actually invokes.
 *
 * No database is involved: better-auth resolves a request with no session
 * cookie to `null` without a query, and every request here stops at
 * `protectedProcedure`'s session check or earlier.
 */

const APP_ORIGIN = "http://localhost:3000";

const rpc = (headers: Record<string, string>) =>
  new NextRequest(`${APP_ORIGIN}/api/orpc/todo/list`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ json: { slug: "acme" } }),
  });

describe("rpc endpoint", () => {
  // `evil.localhost:3000` is a different ORIGIN but the same SITE as the app,
  // so SameSite=Lax attaches the session cookie to a form POST served from it.
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

  // React Native sends no Origin and carries the session in an explicit header,
  // so there is no ambient cookie for another page to forge a call with.
  test("allows a POST with no Origin at all, so the mobile client still reaches it", async () => {
    const response = await POST(rpc({}));

    assert.strictEqual(response.status, 401);
    assert.match(await response.text(), /UNAUTHORIZED/);
  });

  test("refuses GET, so a cross-site navigation cannot invoke a procedure", async () => {
    // Unmatched rather than rejected: `allowMethods` leaves GET off the list,
    // so the handler never resolves a procedure and the route 404s.
    const response = await GET(new NextRequest(`${APP_ORIGIN}/api/orpc/todo/list`));

    assert.strictEqual(response.status, 404);
  });

  test("serves no CORS headers, so a credentialed cross-origin fetch cannot read it", async () => {
    const response = await POST(rpc({}));

    assert.strictEqual(response.headers.get("access-control-allow-origin"), null);
  });
});
