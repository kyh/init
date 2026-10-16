/**
 * End-to-end smoke test, the runtime gate: health, a real sign-in with the seeded
 * login, the todo lifecycle through oRPC, and an authenticated server render,
 * all against a running server. Calls go through the apps' own `RPCLink`, typed
 * against the shared contract, so a changed procedure shape breaks this at typecheck.
 *
 *   pnpm smoke                       # against http://localhost:3000
 *   SMOKE_URL=https://... pnpm smoke # against a deployment (e.g. a preview URL)
 *
 * Requires a seeded database (`pnpm db:seed`) and a server already listening.
 */
import { setTimeout as sleep } from "node:timers/promises";
import { styleText } from "node:util";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractClient } from "@repo/contract";

const BASE_URL = (
  process.env.SMOKE_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`
).replace(/\/$/u, "");

const EMAIL = "dev@init.local";
const PASSWORD = "password";

/** Node's fetch has no default timeout; a stalled server would hang CI instead of failing it. */
const deadline = () => AbortSignal.timeout(15_000);

/** A wall-clock budget, not an attempt count: an attempt takes milliseconds when
 * refused but a full timeout when the server accepts and stalls. */
const BOOT_BUDGET_MS = 90_000;

class SmokeError extends Error {
  override name = "SmokeError";
}

// The annotation is what lets TypeScript narrow after a `fail(...)` call.
const fail: (message: string) => never = (message) => {
  throw new SmokeError(message);
};

const url = (path: string) => `${BASE_URL}${path}`;

/**
 * Sent on the better-auth calls. Node's fetch sends `Sec-Fetch-Mode: cors`, which
 * puts better-auth's CSRF check in strict mode, where a missing Origin is a 403
 * logged nowhere. Against a deployment, SMOKE_URL must be its own origin.
 */
const BROWSER_HEADERS = { origin: BASE_URL };

// ── oRPC client ──────────────────────────────────────────

/** Set by signIn, then sent on every RPC call. */
let cookie = "";

const link = new RPCLink({
  fetch: (request, init) => fetch(request, { ...init, signal: deadline() }),
  headers: () => (cookie ? { cookie } : {}),
  // The link's base URL, not an Origin header: the route allows an absent Origin.
  origin: BASE_URL,
  url: "/api/orpc",
});

const client: ContractClient = createORPCClient(link);

// ── Steps ────────────────────────────────────────────────

/** `status + body`, truncated, so a failure is readable without a rerun. */
const describeResponse = async (response: Response) => {
  const body = await response.text().catch(() => "<unreadable body>");
  const trimmed = body.replaceAll(/\s+/gu, " ").trim();
  return `HTTP ${response.status} — ${trimmed.slice(0, 400) || "<empty body>"}`;
};

/** Polls until healthy. Every unhealthy outcome retries: a booting server accepts
 * TCP well before it can route, so early 404s and 500s are expected. */
const waitForServer = async () => {
  const startedAt = performance.now();
  let lastSeen = "no response at all";
  let attempts = 0;

  while (performance.now() - startedAt < BOOT_BUDGET_MS) {
    attempts += 1;
    try {
      const response = await fetch(url("/api/health"), { signal: deadline() });
      const body: { status?: string } = await response.json();
      if (response.ok && body.status === "ok") {
        return;
      }
      lastSeen = `HTTP ${response.status} ${JSON.stringify(body)}`;
    } catch (error) {
      // A non-JSON error page or a timed-out request, both normal mid-boot.
      lastSeen = error instanceof Error ? error.message : String(error);
    }
    await sleep(250);
  }

  fail(
    `server never became healthy at ${BASE_URL} within ${BOOT_BUDGET_MS / 1000}s ` +
      `(${attempts} attempts) — last saw: ${lastSeen}`,
  );
};

/** Exchanges the seeded login for a session cookie, as AGENTS.md documents. */
const signIn = async () => {
  const response = await fetch(url("/api/auth/sign-in/email"), {
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    headers: { ...BROWSER_HEADERS, "content-type": "application/json" },
    method: "POST",
    signal: deadline(),
  });

  if (!response.ok) {
    fail(
      `sign-in as ${EMAIL} failed: ${await describeResponse(response)}. ` +
        "Is the database seeded? (pnpm db:seed)",
    );
  }

  const cookies = response.headers.getSetCookie();
  if (cookies.length === 0) {
    fail("sign-in succeeded but set no session cookie");
  }

  // Only the name=value pair belongs in a Cookie header; drop the attributes.
  cookie = cookies.map((value) => value.split(";")[0]).join("; ");
};

const firstOrganizationSlug = async () => {
  const response = await fetch(url("/api/auth/organization/list"), {
    headers: { ...BROWSER_HEADERS, cookie },
    signal: deadline(),
  });
  if (!response.ok) {
    fail(`organization list failed: ${await describeResponse(response)}`);
  }

  const organizations: { slug?: string }[] = await response.json();
  const slug = organizations[0]?.slug;
  if (!slug) {
    fail("signed-in user has no organization — the seed did not run correctly");
  }

  return slug;
};

/** The entities React emits when escaping; a Map so a plain string can index it. */
const HTML_ENTITIES = new Map([
  ["&#39;", "'"],
  ["&#x27;", "'"],
  ["&amp;", "&"],
  ["&gt;", ">"],
  ["&lt;", "<"],
  ["&quot;", '"'],
]);

/** One pass, so `&amp;lt;` yields the literal `&lt;` rather than `<`. */
const decodeEntities = (html: string) =>
  html.replaceAll(
    /&(?:amp|lt|gt|quot|#x27|#39);/gu,
    (entity) => HTML_ENTITIES.get(entity) ?? entity,
  );

// ── Run ──────────────────────────────────────────────────

/** Labels any unplanned failure (an RPC error, a socket error) with its step. */
const step = async <T>(label: string, run: () => Promise<T>): Promise<T> => {
  const startedAt = performance.now();
  let result: T;
  try {
    result = await run();
  } catch (error) {
    if (error instanceof SmokeError) {
      throw error;
    }
    return fail(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const elapsed = styleText("dim", `${Math.round(performance.now() - startedAt)}ms`);
  console.log(`  ${styleText("green", "✓")} ${label} ${elapsed}`);
  return result;
};

const main = async () => {
  console.log(`\n  Smoke test → ${BASE_URL}\n`);

  await step("server is live (/api/health)", waitForServer);
  await step(`signed in as ${EMAIL}`, signIn);
  const slug = await step("resolved the seeded organization", firstOrganizationSlug);

  const seeded = await step("read the seeded todos", async () => {
    const { todos } = await client.todo.list({ slug });
    if (todos.length === 0) {
      fail("expected seeded todos, got none — run pnpm db:seed");
    }
    return todos;
  });

  const created = await step("created a todo", async () => {
    const title = `smoke-${Date.now()}`;
    const { todo } = await client.todo.create({ slug, title });
    if (todo?.title !== title) {
      fail("todo.create did not return the created row");
    }
    return todo;
  });

  await step("completed it, and the change persisted", async () => {
    await client.todo.update({ completed: true, id: created.id, slug });

    // Re-read rather than trusting the mutation's echo: this proves the write landed.
    const { todos } = await client.todo.list({ slug });
    const persisted = todos.find((row) => row.id === created.id);
    if (!persisted) {
      fail("created todo is missing from todo.list");
    }
    if (!persisted.completed) {
      fail("todo.update did not persist `completed`");
    }
  });

  await step("deleted it", async () => {
    await client.todo.delete({ id: created.id, slug });

    const { todos } = await client.todo.list({ slug });
    if (todos.some((row) => row.id === created.id)) {
      fail("todo.delete left the row behind");
    }
  });

  await step("the authenticated dashboard renders", async () => {
    const response = await fetch(url(`/dashboard/${slug}`), {
      headers: { ...BROWSER_HEADERS, cookie },
      signal: deadline(),
    });
    if (!response.ok) {
      fail(`/dashboard/${slug} failed: ${await describeResponse(response)}`);
    }

    // A seeded title proves real data rendered, not an empty 200 shell. Decoded
    // first, since React renders `Ben & Jerry` as `Ben &amp; Jerry`.
    const html = decodeEntities(await response.text());
    const title = seeded[0]?.title;
    if (title && !html.includes(title)) {
      fail(`dashboard rendered without the seeded todo "${title}"`);
    }
  });

  console.log(`\n  ${styleText("green", "Smoke test passed.")}\n`);
};

const run = async () => {
  try {
    await main();
  } catch (error) {
    console.error(
      `\n  ${styleText("red", "✗ Smoke test failed:")} ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  }
};

void run();
