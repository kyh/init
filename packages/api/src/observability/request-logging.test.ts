/**
 * Covers the logging middleware's placement in the chain, which is easy to get
 * wrong: it is outermost so that calls rejected *by* a later middleware — the
 * origin guard, input validation, the auth check — still produce a log line.
 * Those are the calls most worth having a record of.
 */
import { describe, expect, it, vi } from "vitest";

import type { RequestLogRecord } from "./logger";
import { createMockContext } from "../test-utils";
import { appRouter } from "../root-router";

vi.mock("./logger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./logger")>();
  return { ...actual, logRequest: vi.fn() };
});

const { logRequest } = await import("./logger");
const logged = vi.mocked(logRequest);

const recordsFor = (path: string): RequestLogRecord[] =>
  logged.mock.calls.map(([record]) => record).filter((record) => record.path === path);

describe("request logging middleware", () => {
  it("logs a call rejected by the origin guard", async () => {
    logged.mockClear();
    const caller = appRouter.createCaller(
      createMockContext({ origin: "https://evil.example", secFetchSite: "cross-site" }),
    );

    await expect(caller.todo.create({ slug: "personal", title: "x" })).rejects.toThrow(
      /Cross-origin/,
    );

    expect(recordsFor("todo.create")).toEqual([
      expect.objectContaining({ ok: false, code: "FORBIDDEN", type: "mutation" }),
    ]);
  });

  it("logs a call rejected for being unauthenticated", async () => {
    logged.mockClear();
    const caller = appRouter.createCaller(createMockContext({ session: null }));

    await expect(caller.todo.list({ slug: "personal" })).rejects.toThrow();

    expect(recordsFor("todo.list")).toEqual([
      expect.objectContaining({ ok: false, code: "UNAUTHORIZED", type: "query" }),
    ]);
  });

  it("logs a call rejected by input validation", async () => {
    logged.mockClear();
    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.todo.list({ slug: "" })).rejects.toThrow();

    expect(recordsFor("todo.list")).toEqual([
      expect.objectContaining({ ok: false, code: "BAD_REQUEST" }),
    ]);
  });

  it("carries the request id, and no user id when nobody is signed in", async () => {
    logged.mockClear();
    const caller = appRouter.createCaller(createMockContext({ session: null }));

    await expect(caller.todo.list({ slug: "personal" })).rejects.toThrow();

    const [record] = recordsFor("todo.list");
    expect(record?.requestId).toBe("test-request-id");
    // No session, so no user to attribute the call to.
    expect(record?.userId).toBeUndefined();
  });

  it("attributes a call to the signed-in user", async () => {
    logged.mockClear();
    const caller = appRouter.createCaller(
      createMockContext({ origin: "https://evil.example", secFetchSite: "cross-site" }),
    );

    await expect(caller.todo.create({ slug: "personal", title: "x" })).rejects.toThrow();

    expect(recordsFor("todo.create")[0]?.userId).toBe("user-1");
  });
});
