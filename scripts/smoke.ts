/**
 * End-to-end smoke test: the runtime gate.
 *
 * `pnpm verify` proves the code compiles, lints, and that units behave. It
 * cannot tell you the app boots, that auth works, or that a mutation reaches
 * the database — which is exactly the class of breakage a typecheck-only gate
 * lets through. This script drives a *running* server over plain HTTP: health,
 * a real sign-in with the seeded login, the full todo lifecycle through tRPC,
 * and a server-rendered authenticated page.
 *
 * Plain `fetch` rather than a browser: it is the same flow `AGENTS.md` documents
 * for agents, it needs nothing installed, and it doesn't flake. Driving the UI
 * itself is agent-browser's job (see AGENTS.md) — this is the part CI can run on
 * every commit.
 *
 *   pnpm smoke                       # against http://localhost:3000
 *   SMOKE_URL=https://... pnpm smoke # against a deployment (e.g. a preview URL)
 *
 * Requires a seeded database (`pnpm db:seed`) and a server already listening.
 */
import { setTimeout as sleep } from "node:timers/promises";

const BASE_URL = (
  process.env.SMOKE_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`
).replace(/\/$/, "");

const EMAIL = "dev@init.local";
const PASSWORD = "password";

/**
 * Node's `fetch` sends `Sec-Fetch-Mode: cors` on every request. That fetch
 * metadata puts better-auth's CSRF middleware into strict mode, where it
 * *requires* an Origin and answers 403 without logging anything server-side when
 * one is missing. A browser sends both headers together; sending neither is the
 * combination nothing real produces. So send the Origin a browser would.
 *
 * It also satisfies the tRPC mutation origin guard (packages/api/src/trpc.ts),
 * which checks the same value against the same trusted-origin list.
 *
 * (`curl` needs none of this — it sends no fetch metadata, so the strict path
 * never engages. That is why the curl recipe in AGENTS.md works as written.)
 *
 * Against a deployment, SMOKE_URL must be that deployment's own origin, since
 * that is what the server derives its trusted origin from.
 */
const BROWSER_HEADERS = { origin: BASE_URL };

/**
 * Node's `fetch` has no default timeout, so a server that accepts the
 * connection and then never answers would leave a request pending forever. In
 * CI that turns a failing gate into a hanging job — the worst outcome of the
 * three, since it burns the runner's whole time budget to tell you nothing.
 * Every request below carries this deadline; an abort rejects, which the retry
 * loop treats as retryable and the later steps report as a failed step.
 */
const REQUEST_TIMEOUT_MS = 15_000;
const deadline = () => AbortSignal.timeout(REQUEST_TIMEOUT_MS);

/**
 * How long to wait for the server to come up. A wall-clock budget rather than a
 * count of attempts: attempts vary from milliseconds (connection refused) to a
 * full REQUEST_TIMEOUT_MS (a server that accepts and then stalls), so a fixed
 * count would mean anywhere from one to sixteen minutes. A budget is the same
 * bound either way, which is what CI needs.
 */
const BOOT_BUDGET_MS = 90_000;

const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

class SmokeError extends Error {}

/**
 * Fails the run with a message, rather than a stack trace nobody reads.
 *
 * The explicit annotation on the const is load-bearing: without it TypeScript
 * won't treat a `fail(...)` call as never-returning, so the narrowing every
 * caller below relies on ("checked it, so it isn't undefined") silently stops
 * working.
 */
const fail: (message: string) => never = (message) => {
  throw new SmokeError(message);
};

const url = (path: string) => `${BASE_URL}${path}`;

// ── tRPC over HTTP ───────────────────────────────────────
// The router uses the superjson transformer, so inputs are wrapped in `json`
// and results arrive the same way. Encoding that here (rather than importing a
// tRPC client) keeps this script dependency-free and makes the wire format
// visible — it's the same shape an agent would curl by hand.

type TrpcResponse<T> = {
  result?: { data?: { json?: T } };
  error?: { json?: { message?: string } };
};

/**
 * The one assertion boundary in this file. `Response.json()` yields `unknown`,
 * and the shape of a reply is only knowable from the procedure that was called
 * — there is nothing here to check it against. Every read of the decoded value
 * below is a guarded field access, so a server that answers with the wrong
 * shape still fails as a named step rather than a `TypeError`.
 */
// oxlint-disable-next-line typescript/consistent-type-assertions -- untrusted HTTP body, decoded once, here
const decode = async <T>(res: Response): Promise<T> => (await res.json()) as T;

/**
 * Renders a failed response as `status + body`. A gate that reports only a bare
 * status makes you re-run CI just to learn what the server said, so every
 * failure path below goes through this. Truncated because an error page can be
 * a whole HTML document.
 */
const describe = async (res: Response): Promise<string> => {
  const body = await res.text().catch(() => "<unreadable body>");
  const trimmed = body.replaceAll(/\s+/g, " ").trim();
  return `HTTP ${res.status} — ${trimmed.slice(0, 400) || "<empty body>"}`;
};

/** The entities React emits when escaping text and attribute content. */
const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
  "&#39;": "'",
};

/** Undoes that escaping so a substring check tests what rendered, not how it
 * was encoded. `&amp;` is handled by the same pass, not a second one, so
 * `&amp;lt;` never collapses into `<`. */
const decodeEntities = (html: string) =>
  html.replaceAll(/&(?:amp|lt|gt|quot|#x27|#39);/g, (entity) => HTML_ENTITIES[entity] ?? entity);

/**
 * The id the server tagged this call's log line with, ready to paste into a
 * failure message. Quoting it is the whole point of the header — without it you
 * are back to correlating CI output against server logs by timestamp.
 */
const traceOf = (res: Response) => {
  const id = res.headers.get("x-request-id");
  return id ? ` [x-request-id: ${id}]` : "";
};

const unwrap = async <T>(res: Response, label: string): Promise<T> => {
  if (!res.ok) fail(`${label} failed: ${await describe(res)}${traceOf(res)}`);

  const parsed = await decode<TrpcResponse<T> | null>(res).catch(() => null);
  if (parsed?.error) {
    fail(`${label} failed: ${parsed.error.json?.message ?? "unknown tRPC error"}${traceOf(res)}`);
  }

  const data = parsed?.result?.data?.json;
  if (data === undefined) fail(`${label} returned no data${traceOf(res)}`);

  return data;
};

const trpcQuery = async <T>(path: string, input: unknown, cookie: string) => {
  const query = `?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
  const res = await fetch(url(`/api/trpc/${path}${query}`), {
    headers: { ...BROWSER_HEADERS, cookie },
    signal: deadline(),
  });
  return { data: await unwrap<T>(res, `query ${path}`), res };
};

const trpcMutation = async <T>(path: string, input: unknown, cookie: string) => {
  const res = await fetch(url(`/api/trpc/${path}`), {
    method: "POST",
    headers: { ...BROWSER_HEADERS, cookie, "content-type": "application/json" },
    body: JSON.stringify({ json: input }),
    signal: deadline(),
  });
  return { data: await unwrap<T>(res, `mutation ${path}`), res };
};

// ── Steps ────────────────────────────────────────────────

/**
 * Polls the liveness endpoint until the server answers healthy. CI starts the
 * server in the background, so the first request would otherwise race the boot.
 *
 * Every unhealthy outcome retries, not just a refused connection: a server that
 * is still booting accepts TCP well before it can route, so it answers 404 or
 * 500 for a while. Treating that as final would make the gate flake on exactly
 * the timing this function exists to absorb. Only running out of attempts fails,
 * and it reports the last thing it saw so the failure is diagnosable.
 */
const waitForServer = async (budgetMs = BOOT_BUDGET_MS) => {
  const startedAt = performance.now();
  let lastSeen = "no response at all";
  let attempts = 0;

  while (performance.now() - startedAt < budgetMs) {
    attempts++;
    try {
      const res = await fetch(url("/api/health"), {
        headers: BROWSER_HEADERS,
        signal: deadline(),
      });
      const body = await decode<{ status?: string }>(res);
      if (res.ok && body.status === "ok") return;
      lastSeen = `HTTP ${res.status} ${JSON.stringify(body)}`;
    } catch (error) {
      // Includes a non-JSON body (a framework error page) and a timed-out
      // request, both of which are normal things to see mid-boot.
      lastSeen = error instanceof Error ? error.message : String(error);
    }
    await sleep(1000);
  }

  fail(
    `server never became healthy at ${BASE_URL} within ${Math.round(budgetMs / 1000)}s ` +
      `(${attempts} attempts) — last saw: ${lastSeen}`,
  );
};

/** Exchanges the seeded login for a session cookie — the same call AGENTS.md
 * documents for headless auth. */
const signIn = async (): Promise<string> => {
  const res = await fetch(url("/api/auth/sign-in/email"), {
    method: "POST",
    headers: { ...BROWSER_HEADERS, "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: deadline(),
  });

  if (!res.ok) {
    fail(
      `sign-in as ${EMAIL} failed: ${await describe(res)}. ` +
        `Is the database seeded? (pnpm db:seed)`,
    );
  }

  const cookies = res.headers.getSetCookie();
  if (cookies.length === 0) fail("sign-in succeeded but set no session cookie");

  // Only the name=value pair belongs in a Cookie header; drop the attributes.
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
};

const firstOrganizationSlug = async (cookie: string): Promise<string> => {
  const res = await fetch(url("/api/auth/organization/list"), {
    headers: { ...BROWSER_HEADERS, cookie },
    signal: deadline(),
  });
  if (!res.ok) fail(`organization list failed: ${await describe(res)}`);

  const organizations = await decode<{ slug?: string }[]>(res);
  const slug = organizations[0]?.slug;
  if (!slug) fail("signed-in user has no organization — the seed did not run correctly");

  return slug;
};

type Todo = { id: string; title: string; completed: boolean };

const listTodos = async (slug: string, cookie: string): Promise<Todo[]> => {
  const { data } = await trpcQuery<{ todos: Todo[] }>("todo.list", { slug }, cookie);
  if (!Array.isArray(data.todos)) fail("todo.list did not return a todos array");
  return data.todos;
};

// ── Run ──────────────────────────────────────────────────

const step = async <T>(label: string, run: () => Promise<T>): Promise<T> => {
  const startedAt = performance.now();

  let result: T;
  try {
    result = await run();
  } catch (error) {
    // A SmokeError already names what went wrong and where. Anything else is
    // unplanned — a socket error, a JSON parse failure — and arrives as a bare
    // message like "fetch failed" with nothing to locate it. Attach the step.
    if (error instanceof SmokeError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    fail(`${label}: ${message}`);
  }

  const ms = Math.round(performance.now() - startedAt);
  console.log(`  ${GREEN}✓${RESET} ${label} ${DIM}${ms}ms${RESET}`);
  return result;
};

const main = async () => {
  console.log(`\n  Smoke test → ${BASE_URL}\n`);

  await step("server is live (/api/health)", waitForServer);

  const cookie = await step(`signed in as ${EMAIL}`, signIn);
  const slug = await step("resolved the seeded organization", () => firstOrganizationSlug(cookie));

  const seeded = await step("read the seeded todos", async () => {
    const todos = await listTodos(slug, cookie);
    if (todos.length === 0) fail("expected seeded todos, got none — run pnpm db:seed");
    return todos;
  });

  const created = await step("created a todo", async () => {
    const title = `smoke-${Date.now()}`;
    const { data, res } = await trpcMutation<{ todo: Todo }>(
      "todo.create",
      { slug, title },
      cookie,
    );

    // The response carries the id its server-side log line was tagged with —
    // the thread an agent pulls when a call fails. See observability/logger.ts.
    if (!res.headers.get("x-request-id")) fail("tRPC response carried no x-request-id");

    if (data.todo?.title !== title) fail("todo.create did not return the created row");
    return data.todo;
  });

  await step("completed it, and the change persisted", async () => {
    await trpcMutation<{ todo: Todo }>(
      "todo.update",
      { slug, id: created.id, completed: true },
      cookie,
    );

    // Re-read rather than trusting the mutation's own echo — this is the step
    // that proves the write reached the database.
    const todos = await listTodos(slug, cookie);
    const persisted = todos.find((todo) => todo.id === created.id);
    if (!persisted) fail("created todo is missing from todo.list");
    if (!persisted.completed) fail("todo.update did not persist `completed`");
  });

  await step("deleted it", async () => {
    await trpcMutation<{ todo: Todo }>("todo.delete", { slug, id: created.id }, cookie);

    const todos = await listTodos(slug, cookie);
    if (todos.some((todo) => todo.id === created.id)) fail("todo.delete left the row behind");
  });

  await step("the authenticated dashboard renders", async () => {
    const res = await fetch(url(`/dashboard/${slug}`), {
      headers: { ...BROWSER_HEADERS, cookie },
      signal: deadline(),
    });
    if (!res.ok) fail(`/dashboard/${slug} failed: ${await describe(res)}`);

    // A seeded title in the HTML proves the page rendered real data, not just
    // that it returned 200 with an empty shell.
    //
    // Entities are decoded first: React escapes `&`, `<` and `>` in text, so a
    // todo titled `Ben & Jerry` renders as `Ben &amp; Jerry` and a raw
    // substring match would fail on a page that rendered perfectly. Today's
    // seed titles are plain ASCII, which is the only reason this hasn't bitten
    // — the check should be about rendering, not about escaping.
    const html = decodeEntities(await res.text());
    const title = seeded[0]?.title;
    if (title && !html.includes(title)) {
      fail(`dashboard rendered without the seeded todo "${title}"`);
    }
  });

  console.log(`\n  ${GREEN}Smoke test passed.${RESET}\n`);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n  ${RED}✗ Smoke test failed:${RESET} ${message}\n`);
  process.exit(1);
});
