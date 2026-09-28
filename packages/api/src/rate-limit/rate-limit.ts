import { randomUUID } from "node:crypto";
import { db } from "@repo/db/drizzle-client";
import { rateLimit } from "@repo/db/drizzle-schema-auth";
import { sql } from "drizzle-orm";

/** A fixed window per client address. Rows live in better-auth's `rate_limit` table, whose
 * `last_request` holds the window start here; better-auth prunes rows older than its own 60s
 * window, so this window must stay at 60s or less or live windows get deleted early. */
export const API_RATE_LIMIT = { max: 100, windowSeconds: 60 };

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

export const consumeRateLimit = async (key: string, now = Date.now()): Promise<RateLimitResult> => {
  const { max, windowSeconds } = API_RATE_LIMIT;
  const windowMs = windowSeconds * 1000;
  const expired = sql`${now} - ${rateLimit.lastRequest} >= ${windowMs}`;

  // One upsert keeps concurrent requests from different instances from losing counts.
  const [row] = await db
    .insert(rateLimit)
    .values({ count: 1, id: randomUUID(), key, lastRequest: now })
    .onConflictDoUpdate({
      set: {
        // Capped at max + 1: enough to mark the window exhausted without growing forever.
        count: sql`case when ${expired} then 1 else least(${rateLimit.count} + 1, ${max + 1}) end`,
        lastRequest: sql`case when ${expired} then ${now} else ${rateLimit.lastRequest} end`,
      },
      target: rateLimit.key,
    })
    .returning({ count: rateLimit.count, windowStart: rateLimit.lastRequest });

  const count = row?.count ?? 1;
  const windowStart = row?.windowStart ?? now;
  return {
    allowed: count <= max,
    remaining: Math.max(0, max - count),
    resetSeconds: Math.max(0, Math.ceil((windowStart + windowMs - now) / 1000)),
  };
};

/** Sends both generations of the IETF RateLimit draft: the RateLimit-Limit/-Remaining/-Reset
 * trio most clients still parse, and the structured RateLimit + RateLimit-Policy pair. */
export const rateLimitHeaders = ({ allowed, remaining, resetSeconds }: RateLimitResult) => {
  const { max, windowSeconds } = API_RATE_LIMIT;
  const headers = new Headers({
    RateLimit: `"default";r=${remaining};t=${resetSeconds}`,
    "RateLimit-Limit": String(max),
    "RateLimit-Policy": `"default";q=${max};w=${windowSeconds}`,
    "RateLimit-Remaining": String(remaining),
    "RateLimit-Reset": String(resetSeconds),
  });
  if (!allowed) {
    headers.set("Retry-After", String(resetSeconds));
  }
  return headers;
};
