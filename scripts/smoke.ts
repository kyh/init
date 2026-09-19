/**
 * End-to-end smoke test: the runtime gate.
 *
 * `pnpm verify` proves the code compiles, lints, and that units behave. It cannot
 * tell you the app boots, that auth works, or that a mutation reaches the
 * database — exactly the class of breakage a typecheck-only gate lets through.
 * This drives a *running* server: health, a real sign-in with the seeded login,
 * the full todo lifecycle through oRPC, and a server-rendered authenticated page.
 *
 * It calls oRPC through the same `RPCLink` client the apps use, typed against
 * `AppRouter`, rather than hand-writing the RPC wire format. So a procedure whose
 * input or output shape changes breaks this at typecheck, and the transport under
 * test is the real one.
 *
 *   pnpm smoke                       # against http://localhost:3000
 *   SMOKE_URL=https://... pnpm smoke # against a deployment (e.g. a preview URL)
 *
 * Requires a seeded database (`pnpm db:seed`) and a server already listening.
 */
import { setTimeout as sleep } from "node:timers/promises";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "@repo/api";
// The deep import is deliberate: `@repo/api`'s entrypoint pulls in better-auth,
// so importing a value from it would make this script initialise auth (and need
// its environment) just to learn a header name. The AppRouter import above is
// type-only, so it is erased.
import { REQUEST_ID_HEADER } from "@repo/api/observability/logger";

const BASE_URL = (
  process.env.SMOKE_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`
).replace(/\/$/u, "");

const EMAIL = "dev@init.local";
const PASSWORD = "password";

/**
 * Node's `fetch` has no default timeout, so a server that accepts the connection
 * and then never answers would leave a request pending forever. In CI that turns
 * a failing gate into a hanging job — the worst of the three outcomes, since it
 * burns the runner's whole budget to tell you nothing.
 */
const REQUEST_TIMEOUT_MS = 15_000;
const deadline = () => AbortSignal.timeout(REQUEST_TIMEOUT_MS);

/**
 * How long to wait for the server to come up. A wall-clock budget rather than a
 * count of attempts: an attempt takes milliseconds when the connection is refused
 * but a full REQUEST_TIMEOUT_MS when the server accepts and stalls, so a fixed
 * count would mean anywhere from one minute to sixteen. A budget is the same
 * bound either way, which is what CI needs.
 */
const BOOT_BUDGET_MS = 90_000;

const DIM = "\u001B[2m";
const GREEN = "\u001B[32m";
const RED = "\u001B[31m";
const RESET = "\u001B[0m";

class SmokeError extends Error {
  override name = "SmokeError";
}

/**
 * Fails the run with a message rather than a stack trace nobody reads.
 *
 * The explicit annotation on the const is load-bearing: without it TypeScript
 * won't treat a `fail(...)` call as never-returning, so the narrowing callers
 * below rely on ("checked it, so it isn't undefined") silently stops working.
 */
const fail: (message: string) => never = (message) => {
  throw new SmokeError(message);
};

const url = (path: string) => `${BASE_URL}${path}`;

/**
 * Sent on the better-auth calls below. Node's `fetch` always sends
 * `Sec-Fetch-Mode: cors`, and that fetch metadata puts better-auth's CSRF check
 * into strict mode, where a missing Origin is a 403 raised *without* logging
 * anything server-side — a miserable failure to debug. A browser sends both
 * headers together; sending metadata without an origin is a combination nothing
 * real produces. (`curl` sends neither, so the strict path never engages, which
 * is why the curl recipe in AGENTS.md needs no such header.)
 *
 * Against a deployment, SMOKE_URL must be that deployment's own origin, since
 * that is what the server derives its trusted origin from.
 */
const BROWSER_HEADERS = { origin: BASE_URL };

// ── oRPC client ──────────────────────────────────────────

/** Set by signIn, then sent on every RPC call. */
let cookie = "";

/**
 * The id from the most recent RPC response. Captured so a failure can quote the
 * id its server-side log line was tagged with — the whole point of the header.
 */
let lastRequestId: string | null = null;

const link = new RPCLink({
  fetch: async (request, init) => {
    const response = await fetch(request, { ...init, signal: deadline() });
    lastRequestId = response.headers.get(REQUEST_ID_HEADER);
    return response;
  },
  headers: () => (cookie ? { cookie } : {}),
  // `origin` here is the link's base URL, not the HTTP Origin header — none is
  // sent. The route handler allows an absent Origin for non-browser clients and
  // rejects a mismatched one, so sending it would only add a way to fail when
  // SMOKE_URL is an alias of the deployment rather than its own origin.
  origin: BASE_URL,
  url: "/api/orpc",
});

const client: RouterClient<AppRouter> = createORPCClient(link);

/** Runs an RPC call, turning any rejection into a named failure that quotes the
 * request id, so CI output points straight at the matching server log line. */
const rpc = async <T>(label: string, run: () => Promise<T>): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const trace = lastRequestId ? ` [${REQUEST_ID_HEADER}: ${lastRequestId}]` : "";
    return fail(`${label} failed: ${message}${trace}`);
  }
};

// ── Steps ────────────────────────────────────────────────

/**
 * Renders a failed response as `status + body`. A gate that reports only a bare
 * status makes you re-run CI just to learn what the server said. Truncated
 * because an error page can be a whole HTML document.
 */
const describeResponse = async (response: Response) => {
  const body = await response.text().catch(() => "<unreadable body>");
  const trimmed = body.replaceAll(/\s+/gu, " ").trim();
  return `HTTP ${response.status} — ${trimmed.slice(0, 400) || "<empty body>"}`;
};

/**
 * Polls the liveness endpoint until the server answers healthy.
 *
 * Every unhealthy outcome retries, not just a refused connection: a server still
 * booting accepts TCP well before it can route, so it answers 404 or 500 for a
 * while, and treating that as final would flake on the very timing this exists to
 * absorb. Only exhausting the budget fails, and it reports the last thing seen.
 */
const waitForServer = async (budgetMs = BOOT_BUDGET_MS) => {
  const startedAt = performance.now();
  let lastSeen = "no response at all";
  let attempts = 0;

  while (performance.now() - startedAt < budgetMs) {
    attempts += 1;
    try {
      const response = await fetch(url("/api/health"), { signal: deadline() });
      const body: { status?: string } = await response.json();
      if (response.ok && body.status === "ok") {
        return;
      }
      lastSeen = `HTTP ${response.status} ${JSON.stringify(body)}`;
    } catch (error) {
      // Covers a non-JSON body (a framework error page) and a timed-out request,
      // both normal things to see mid-boot.
      lastSeen = error instanceof Error ? error.message : String(error);
    }
    await sleep(1000);
  }

  fail(
    `server never became healthy at ${BASE_URL} within ${Math.round(budgetMs / 1000)}s ` +
      `(${attempts} attempts) — last saw: ${lastSeen}`,
  );
};

/** Exchanges the seeded login for a session cookie — the flow AGENTS.md documents
 * for headless auth. */
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

/** The entities React emits when escaping text and attribute content. A Map so
 * a plain string can index it without widening a literal-keyed object. */
const HTML_ENTITIES = new Map([
  ["&#39;", "'"],
  ["&#x27;", "'"],
  ["&amp;", "&"],
  ["&gt;", ">"],
  ["&lt;", "<"],
  ["&quot;", '"'],
]);

/** Undoes that escaping so a substring check tests what rendered, not how it was
 * encoded. One pass, so `&amp;lt;` yields the literal `&lt;` rather than `<`. */
const decodeEntities = (html: string) =>
  html.replaceAll(
    /&(?:amp|lt|gt|quot|#x27|#39);/gu,
    (entity) => HTML_ENTITIES.get(entity) ?? entity,
  );

// ── Run ──────────────────────────────────────────────────

const step = async <T>(label: string, run: () => Promise<T>): Promise<T> => {
  const startedAt = performance.now();

  let result: T;
  try {
    result = await run();
  } catch (error) {
    // A SmokeError already names what failed and where. Anything else is
    // unplanned — a socket error, a JSON parse failure — and arrives as a bare
    // message with nothing to locate it, so attach the step.
    if (error instanceof SmokeError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    return fail(`${label}: ${message}`);
  }

  console.log(
    `  ${GREEN}✓${RESET} ${label} ${DIM}${Math.round(performance.now() - startedAt)}ms${RESET}`,
  );
  return result;
};

const main = async () => {
  console.log(`\n  Smoke test → ${BASE_URL}\n`);

  await step("server is live (/api/health)", () => waitForServer());
  await step(`signed in as ${EMAIL}`, signIn);
  const slug = await step("resolved the seeded organization", firstOrganizationSlug);

  const seeded = await step("read the seeded todos", async () => {
    const { todos } = await rpc("todo.list", () => client.todo.list({ slug }));
    if (todos.length === 0) {
      fail("expected seeded todos, got none — run pnpm db:seed");
    }
    return todos;
  });

  const created = await step("created a todo", async () => {
    const title = `smoke-${Date.now()}`;
    const { todo } = await rpc("todo.create", () => client.todo.create({ slug, title }));

    // The response carries the id its server-side log line was tagged with — the
    // thread to pull when a call fails. See observability/logger.ts.
    if (!lastRequestId) {
      fail(`oRPC response carried no ${REQUEST_ID_HEADER}`);
    }
    if (todo?.title !== title) {
      fail("todo.create did not return the created row");
    }
    return todo;
  });

  await step("completed it, and the change persisted", async () => {
    await rpc("todo.update", () => client.todo.update({ completed: true, id: created.id, slug }));

    // Re-read rather than trusting the mutation's own echo — this is the step
    // that proves the write reached the database.
    const { todos } = await rpc("todo.list", () => client.todo.list({ slug }));
    const persisted = todos.find((row) => row.id === created.id);
    if (!persisted) {
      fail("created todo is missing from todo.list");
    }
    if (!persisted.completed) {
      fail("todo.update did not persist `completed`");
    }
  });

  await step("deleted it", async () => {
    await rpc("todo.delete", () => client.todo.delete({ id: created.id, slug }));

    const { todos } = await rpc("todo.list", () => client.todo.list({ slug }));
    if (todos.some((row) => row.id === created.id)) {
      fail("todo.delete left the row behind");
    }
  });

  await step("read the feature flags", async () => {
    const { flags } = await rpc("flag.list", () => client.flag.list());
    if (Object.keys(flags).length === 0) {
      fail("flag.list returned an empty flag set");
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

    // A seeded title in the HTML proves the page rendered real data, not just
    // that it returned 200 with an empty shell. Entities are decoded first:
    // React escapes `&`, `<` and `>` in text, so a todo titled `Ben & Jerry`
    // renders as `Ben &amp; Jerry` and a raw match would fail on a page that
    // rendered correctly.
    const html = decodeEntities(await response.text());
    const title = seeded[0]?.title;
    if (title && !html.includes(title)) {
      fail(`dashboard rendered without the seeded todo "${title}"`);
    }
  });

  console.log(`\n  ${GREEN}Smoke test passed.${RESET}\n`);
};

const run = async () => {
  try {
    await main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n  ${RED}✗ Smoke test failed:${RESET} ${message}\n`);
    process.exit(1);
  }
};

void run();
