import { setTimeout as sleep } from "node:timers/promises";
import { styleText } from "node:util";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractClient } from "@repo/contract";
import { z } from "zod";

const BASE_URL = (
  process.env.SMOKE_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`
).replace(/\/$/u, "");

const EMAIL = "dev@init.local";
const PASSWORD = "password";

const deadline = () => AbortSignal.timeout(15_000);

const BOOT_BUDGET_MS = 90_000;

class SmokeError extends Error {
  override name = "SmokeError";
}

const fail: (message: string) => never = (message) => {
  throw new SmokeError(message);
};

const url = (path: string) => `${BASE_URL}${path}`;

const BROWSER_HEADERS = { origin: BASE_URL };

let cookie = "";

const link = new RPCLink({
  fetch: async (request, init) => await fetch(request, { ...init, signal: deadline() }),
  headers: () => (cookie ? { cookie } : {}),
  origin: BASE_URL,
  url: "/api/orpc",
});

const client: ContractClient = createORPCClient(link);

const describeResponse = async (response: Response) => {
  const body = await response.text().catch(() => "<unreadable body>");
  const trimmed = body.replaceAll(/\s+/gu, " ").trim();

  return `HTTP ${response.status} — ${trimmed.slice(0, 400) || "<empty body>"}`;
};

const waitForServer = async () => {
  const startedAt = performance.now();
  let lastSeen = "no response at all";
  let attempts = 0;

  while (performance.now() - startedAt < BOOT_BUDGET_MS) {
    attempts += 1;

    try {
      // oxlint-disable-next-line no-await-in-loop -- polls until the server answers
      const response = await fetch(url("/api/health"), { signal: deadline() });

      const body = z
        .object({ status: z.string().optional() })
        .catch({})
        // oxlint-disable-next-line no-await-in-loop -- polls until the server answers
        .parse(await response.json());

      if (response.ok && body.status === "ok") {
        return;
      }

      lastSeen = `HTTP ${response.status} ${JSON.stringify(body)}`;
    } catch (error) {
      lastSeen = error instanceof Error ? error.message : String(error);
    }

    // oxlint-disable-next-line no-await-in-loop -- polls until the server answers
    await sleep(250);
  }

  fail(
    `server never became healthy at ${BASE_URL} within ${BOOT_BUDGET_MS / 1000}s ` +
      `(${attempts} attempts) — last saw: ${lastSeen}`,
  );
};

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

  const organizations = z
    .array(z.object({ slug: z.string().optional() }))
    .parse(await response.json());

  const slug = organizations[0]?.slug;

  if (slug === undefined) {
    fail("signed-in user has no organization — the seed did not run correctly");
  }

  return slug;
};

const HTML_ENTITIES = new Map([
  ["&#39;", "'"],
  ["&#x27;", "'"],
  ["&amp;", "&"],
  ["&gt;", ">"],
  ["&lt;", "<"],
  ["&quot;", '"'],
]);

const decodeEntities = (html: string) =>
  html.replaceAll(
    /&(?:amp|lt|gt|quot|#x27|#39);/gu,
    (entity) => HTML_ENTITIES.get(entity) ?? entity,
  );

const step = async <T>(label: string, run: () => Promise<T>) => {
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

    const html = decodeEntities(await response.text());
    const title = seeded[0]?.title;

    if (title !== undefined && !html.includes(title)) {
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
