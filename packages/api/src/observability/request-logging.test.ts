/** The logging middleware sits outermost and logs from a catch, so calls rejected
 * by a later middleware (auth, membership, input validation) still produce a record. */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
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

const records = (context: ReturnType<typeof createMockContext>) =>
  context.log.mock.calls.map(({ arguments: [record] }) => record);

describe("request logging middleware", () => {
  test("logs a successful call with its dotted path and the caller's user id", async () => {
    const context = createMockContext();
    const caller = createRouterClient(testRouter, { context });
    assert.equal(await caller.publicQuery(), "reached");

    const [record, ...rest] = records(context);
    assert.deepEqual(rest, []);
    assert.equal(record?.path, "publicQuery");
    assert.equal(record?.ok, true);
    assert.equal(record?.code, undefined);
    assert.equal(record?.requestId, "test-request-id");
    assert.equal(record?.userId, "user-1");
    assert.ok(Number.isInteger(record?.durationMs));
  });

  test("logs a call rejected by the auth check, with its code", async () => {
    const context = createMockContext(null);
    const caller = createRouterClient(testRouter, { context });
    await assert.rejects(caller.protectedQuery(), { code: "UNAUTHORIZED" });

    const [record, ...rest] = records(context);
    assert.deepEqual(rest, []);
    assert.equal(record?.ok, false);
    assert.equal(record?.code, "UNAUTHORIZED");
    assert.equal(record?.path, "protectedQuery");
    assert.equal(record?.userId, undefined);
  });

  test("logs a call rejected by input validation, under its nested path", async () => {
    const context = createMockContext();
    const caller = createRouterClient(testRouter, { context });
    // @ts-expect-error -- deliberately invalid input, which the schema rejects
    await assert.rejects(caller.nested.organizationQuery({ slug: 42 }));

    const [record] = records(context);
    assert.equal(record?.ok, false);
    assert.equal(record?.code, "BAD_REQUEST");
    assert.equal(record?.path, "nested.organizationQuery");
  });
});
