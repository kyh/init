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

const unwrap = async <T>(res: Response, label: string): Promise<T> => {
  const parsed = await decode<TrpcResponse<T> | null>(res).catch(() => null);

  if (!res.ok || parsed?.error) {
    fail(`${label} failed: ${parsed?.error?.json?.message ?? `HTTP ${res.status}`}`);
  }

  const data = parsed?.result?.data?.json;
  if (data === undefined) fail(`${label} returned no data`);

  return data;
};

const trpcQuery = async <T>(path: string, input: unknown, cookie: string) => {
  const query = `?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
  const res = await fetch(url(`/api/trpc/${path}${query}`), { headers: { cookie } });
  return { data: await unwrap<T>(res, `query ${path}`), res };
};

const trpcMutation = async <T>(path: string, input: unknown, cookie: string) => {
  const res = await fetch(url(`/api/trpc/${path}`), {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ json: input }),
  });
  return { data: await unwrap<T>(res, `mutation ${path}`), res };
};

// ── Steps ────────────────────────────────────────────────

/**
 * Polls the liveness endpoint until the server answers. CI starts the server in
 * the background, so the first request would otherwise race the boot.
 */
const waitForServer = async (attempts = 60) => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url("/api/health"));
      const body = await decode<{ status?: string }>(res);
      if (res.ok && body.status === "ok") return;
      fail(`/api/health answered ${res.status} ${JSON.stringify(body)}`);
    } catch (error) {
      if (error instanceof SmokeError) throw error;
      if (attempt === attempts) {
        fail(`server never came up at ${BASE_URL} (${attempts} attempts)`);
      }
      await sleep(1000);
    }
  }
};

/** Exchanges the seeded login for a session cookie — the same call AGENTS.md
 * documents for headless auth. */
const signIn = async (): Promise<string> => {
  const res = await fetch(url("/api/auth/sign-in/email"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!res.ok) {
    fail(`sign-in as ${EMAIL} returned ${res.status}. Is the database seeded? (pnpm db:seed)`);
  }

  const cookies = res.headers.getSetCookie();
  if (cookies.length === 0) fail("sign-in succeeded but set no session cookie");

  // Only the name=value pair belongs in a Cookie header; drop the attributes.
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
};

const firstOrganizationSlug = async (cookie: string): Promise<string> => {
  const res = await fetch(url("/api/auth/organization/list"), { headers: { cookie } });
  if (!res.ok) fail(`organization list returned ${res.status}`);

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
  const result = await run();
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
    const res = await fetch(url(`/dashboard/${slug}`), { headers: { cookie } });
    if (!res.ok) fail(`/dashboard/${slug} returned ${res.status}`);

    // A seeded title in the HTML proves the page rendered real data, not just
    // that it returned 200 with an empty shell.
    const html = await res.text();
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
