import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, test } from "node:test";
import { db } from "@repo/db/drizzle-client";

import { API_RATE_LIMIT, consumeRateLimit, rateLimitHeaders } from "./rate-limit";

describe("rateLimitHeaders", () => {
  test("reports the window and adds Retry-After only when refused", () => {
    const open = rateLimitHeaders({ allowed: true, remaining: 7, resetSeconds: 30 });
    assert.equal(open.get("RateLimit-Limit"), String(API_RATE_LIMIT.max));
    assert.equal(open.get("RateLimit-Remaining"), "7");
    assert.equal(open.get("RateLimit-Reset"), "30");
    assert.equal(open.get("RateLimit"), '"default";r=7;t=30');
    assert.equal(
      open.get("RateLimit-Policy"),
      `"default";q=${API_RATE_LIMIT.max};w=${API_RATE_LIMIT.windowSeconds}`,
    );
    assert.equal(open.get("Retry-After"), null);

    const refused = rateLimitHeaders({ allowed: false, remaining: 0, resetSeconds: 12 });
    assert.equal(refused.get("Retry-After"), "12");
  });
});

/** The counter is one SQL upsert, so only a real database proves it. */
const skip = process.env.TEST_POSTGRES_URL ? false : "TEST_POSTGRES_URL is unset";

describe("consumeRateLimit", { skip }, () => {
  after(async () => {
    await db.$client.end();
  });

  test("counts down, refuses past the limit, and resets when the window ends", async () => {
    const key = `test:${randomUUID()}`;
    const start = Date.now();
    const { max, windowSeconds } = API_RATE_LIMIT;

    const first = await consumeRateLimit(key, start);
    assert.deepEqual(first, { allowed: true, remaining: max - 1, resetSeconds: windowSeconds });

    let last = first;
    for (let used = 1; used < max; used += 1) {
      last = await consumeRateLimit(key, start + 1000);
    }
    assert.deepEqual(last, { allowed: true, remaining: 0, resetSeconds: windowSeconds - 1 });

    const refused = await consumeRateLimit(key, start + 2000);
    assert.deepEqual(refused, { allowed: false, remaining: 0, resetSeconds: windowSeconds - 2 });

    const fresh = await consumeRateLimit(key, start + windowSeconds * 1000);
    assert.deepEqual(fresh, { allowed: true, remaining: max - 1, resetSeconds: windowSeconds });
  });
});
