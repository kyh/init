import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { organizationBase, protectedBase, publicBase } from "@repo/contract/base";
import { organizationInput } from "@repo/contract/organization/organization-schema";
import { organization } from "@repo/db/drizzle-schema-auth";
import { createRouterClient, implement } from "@orpc/server";
import { z } from "zod";

import {
  createMockContext,
  createMemberContext,
  databaseRows,
  mockOrganization,
} from "../test-utils";
import type { ORPCContext } from "../orpc";
import { requireOrganization, requireSession } from "../orpc";

const testContract = {
  organizationQuery: organizationBase.input(organizationInput).output(z.unknown()),
  protectedQuery: protectedBase.output(z.string()),
  publicQuery: publicBase.output(z.boolean()),
};

const os = implement(testContract).$context<ORPCContext>();

const testRouter = os.router({
  organizationQuery: os.organizationQuery.use(requireOrganization).handler(({ context }) => ({
    organizationId: context.organization.id,
    role: context.membership.role,
  })),
  protectedQuery: os.protectedQuery
    .use(requireSession)
    .handler(({ context }) => context.session.user.id),
  publicQuery: os.publicQuery.handler(({ context }) => context.session !== null),
});

describe("procedure authorization", () => {
  test("allows public access and passes authenticated sessions through", async () => {
    const caller = createRouterClient(testRouter, { context: createMockContext() });
    assert.equal(await caller.publicQuery(), true);
    assert.equal(await caller.protectedQuery(), "user-1");

    const anonymous = createRouterClient(testRouter, { context: createMockContext(null) });
    assert.equal(await anonymous.publicQuery(), false);
    await assert.rejects(anonymous.protectedQuery(), { code: "UNAUTHORIZED" });
  });

  test("resolves organization by slug and membership by organization and current user", async () => {
    const context = createMemberContext();
    const caller = createRouterClient(testRouter, { context });
    assert.deepEqual(await caller.organizationQuery({ slug: "acme" }), {
      organizationId: "org-1",
      role: "owner",
    });
    const [organizationQuery, membershipQuery] = context.query.mock.calls;
    assert.ok(organizationQuery);
    assert.match(
      organizationQuery.arguments[0],
      /from "organization" as "d0" where "d0"\."slug" = \$1/u,
    );
    assert.deepEqual(organizationQuery.arguments[1], ["acme", 1]);
    assert.ok(membershipQuery);
    assert.match(
      membershipQuery.arguments[0],
      /from "member" as "d0" where \(\("d0"\."organization_id" = \$1\) and \("d0"\."user_id" = \$2\)\)/u,
    );
    assert.deepEqual(membershipQuery.arguments[1], ["org-1", "user-1", 1]);
  });

  test("rejects non-members before running the handler", async () => {
    const context = createMockContext();
    context.responses.push(databaseRows(organization, mockOrganization), []);
    const caller = createRouterClient(testRouter, { context });
    await assert.rejects(caller.organizationQuery({ slug: "acme" }), { code: "UNAUTHORIZED" });
    assert.equal(context.query.mock.callCount(), 2);
  });

  test("reports a missing organization without querying membership", async () => {
    const context = createMockContext();
    context.responses.push([]);
    const caller = createRouterClient(testRouter, { context });
    await assert.rejects(caller.organizationQuery({ slug: "missing" }), { code: "NOT_FOUND" });
    assert.equal(context.query.mock.callCount(), 1);
  });

  test("rejects unauthenticated callers before querying", async () => {
    const context = createMockContext(null);
    const caller = createRouterClient(testRouter, { context });
    await assert.rejects(caller.organizationQuery({ slug: "acme" }), { code: "UNAUTHORIZED" });
    assert.equal(context.query.mock.callCount(), 0);
  });

  test("rejects an empty slug before querying", async () => {
    const context = createMockContext();
    const caller = createRouterClient(testRouter, { context });
    await assert.rejects(caller.organizationQuery({ slug: "" }), { code: "BAD_REQUEST" });
    assert.equal(context.query.mock.callCount(), 0);
  });
});
