/**
 * Covers the logging middleware's placement and its failure path.
 *
 * Two things are easy to get wrong here. It sits outermost, so calls rejected
 * *by* a later middleware — the auth check, organization membership, input
 * validation — still produce a log line; those are the ones worth having a
 * record of. And in oRPC `next()` throws on a downstream failure rather than
 * returning an `{ ok: false }` result, so logging only after a resolved `next()`
 * would silently omit every rejected call.
 *
 * Asserted through the real console output rather than a stubbed logger, so the
 * whole path — middleware, logRequest, stream choice — is what's under test.
 */
import assert from "node:assert/strict";
import { describe, mock, test } from "node:test";
import { createRouterClient } from "@orpc/server";

import { createMockContext } from "../test-utils";
import { organizationInput } from "../organization/organization-schema";
import { organizationProcedure, protectedProcedure, publicProcedure } from "../orpc";

const testRouter = {
  nested: {
    organizationQuery: organizationProcedure(organizationInput).handler(() => "reached"),
  },
  protectedQuery: protectedProcedure.handler(() => "reached"),
  publicQuery: publicProcedure.handler(() => "reached"),
};

/** The shape logRequest writes. Declared so the assertions below read fields off
 * a contract rather than probing an untyped bag. */
interface LoggedLine {
  code?: string;
  durationMs: number;
  ok: boolean;
  path: string;
  requestId: string;
  ts: string;
  userId?: string;
}

/** JSON.parse yields `any`; the annotation is the contract, and every assertion
 * below would fail loudly if the real line did not match it. */
const parseLine = (line: string): LoggedLine => JSON.parse(line);

/**
 * Runs `act` with the test-runner silence lifted, collecting the JSON lines the
 * middleware writes to each stream.
 */
const recordLines = async (act: () => Promise<void>) => {
  const context = process.env.NODE_TEST_CONTEXT;
  delete process.env.NODE_TEST_CONTEXT;
  process.env.NODE_ENV = "production";

  const out: LoggedLine[] = [];
  const err: LoggedLine[] = [];
  const push = (into: LoggedLine[]) => (line: string) => {
    into.push(parseLine(line));
  };
  const logSpy = mock.method(console, "log", push(out));
  const errorSpy = mock.method(console, "error", push(err));

  try {
    await act();
  } finally {
    logSpy.mock.restore();
    errorSpy.mock.restore();
    delete process.env.NODE_ENV;
    if (context !== undefined) {
      process.env.NODE_TEST_CONTEXT = context;
    }
  }

  return { err, out };
};

describe("request logging middleware", () => {
  test("logs a successful call with its dotted path and the caller's user id", async () => {
    const { err, out } = await recordLines(async () => {
      const caller = createRouterClient(testRouter, { context: createMockContext() });
      assert.equal(await caller.publicQuery(), "reached");
    });

    assert.deepEqual(err, []);
    assert.equal(out.length, 1);
    assert.equal(out[0]?.path, "publicQuery");
    assert.equal(out[0]?.ok, true);
    assert.equal(out[0]?.requestId, "test-request-id");
    assert.equal(out[0]?.userId, "user-1");
    assert.ok(Number.isInteger(out[0]?.durationMs));
  });

  test("logs a call rejected by the auth check, to stderr, with its code", async () => {
    const { err, out } = await recordLines(async () => {
      const caller = createRouterClient(testRouter, { context: createMockContext(null) });
      await assert.rejects(caller.protectedQuery(), { code: "UNAUTHORIZED" });
    });

    assert.deepEqual(out, []);
    assert.equal(err.length, 1);
    assert.equal(err[0]?.ok, false);
    assert.equal(err[0]?.code, "UNAUTHORIZED");
    assert.equal(err[0]?.path, "protectedQuery");
    // No session, so there is no user to attribute the call to.
    assert.equal(err[0]?.userId, undefined);
  });

  test("logs a call rejected by input validation", async () => {
    const { err } = await recordLines(async () => {
      const caller = createRouterClient(testRouter, { context: createMockContext() });
      // @ts-expect-error -- deliberately invalid input, which the schema rejects
      await assert.rejects(caller.nested.organizationQuery({ slug: 42 }));
    });

    assert.equal(err.length, 1);
    assert.equal(err[0]?.ok, false);
    assert.equal(err[0]?.code, "BAD_REQUEST");
    // Nested routers contribute every segment, so a log line locates the call.
    assert.equal(err[0]?.path, "nested.organizationQuery");
  });
});
