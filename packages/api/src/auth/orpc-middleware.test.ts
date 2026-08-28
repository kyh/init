import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ORPCError } from "@orpc/server";

import { createCallerFactory, createMockContext } from "../test-utils";
import { organizationProcedure, protectedProcedure, publicProcedure } from "../orpc";
import { organizationInput } from "../organization/organization-schema";

const ORG = { id: "org-1", name: "Acme", slug: "acme", logo: null, metadata: null };
const MEMBERSHIP = { id: "mem-1", organizationId: "org-1", userId: "user-1", role: "owner" };

const testRouter = {
  protectedQuery: protectedProcedure.handler(({ context }) => ({
    userId: context.session.user.id,
  })),
  publicQuery: publicProcedure.handler(({ context }) => ({
    hasSession: context.session !== null,
  })),
  organizationQuery: organizationProcedure(organizationInput).handler(({ context }) => ({
    organizationId: context.organization.id,
    role: context.membership.role,
  })),
};

const createCaller = createCallerFactory(testRouter);

describe("protectedProcedure", () => {
  test("provides non-nullable session to handler", async () => {
    const caller = createCaller(createMockContext());
    const result = await caller.protectedQuery();
    assert.strictEqual(result.userId, "user-1");
  });

  test("rejects unauthenticated users with UNAUTHORIZED", async () => {
    const caller = createCaller(createMockContext({ session: null }));
    await assert.rejects(caller.protectedQuery(), ORPCError);
    await assert.rejects(caller.protectedQuery(), /You must be logged in/);
  });
});

describe("organizationProcedure", () => {
  const memberContext = () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mock.mockImplementation(() => Promise.resolve(ORG));
    ctx.db.query.member.findFirst.mock.mockImplementation(() => Promise.resolve(MEMBERSHIP));
    return ctx;
  };

  test("provides the resolved organization and membership to the handler", async () => {
    const caller = createCaller(memberContext());
    const result = await caller.organizationQuery({ slug: "acme" });
    assert.deepEqual(result, { organizationId: "org-1", role: "owner" });
  });

  test("rejects a non-member with UNAUTHORIZED without running the handler", async () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mock.mockImplementation(() => Promise.resolve(ORG));
    ctx.db.query.member.findFirst.mock.mockImplementation(() => Promise.resolve(undefined));

    const caller = createCaller(ctx);
    await assert.rejects(
      caller.organizationQuery({ slug: "acme" }),
      /You do not have access to this organization/,
    );
  });

  test("reports a missing organization as NOT_FOUND, distinct from non-membership", async () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mock.mockImplementation(() => Promise.resolve(undefined));

    const caller = createCaller(ctx);
    await assert.rejects(caller.organizationQuery({ slug: "nope" }), /Organization not found/);
    assert.strictEqual(ctx.db.query.member.findFirst.mock.callCount(), 0);
  });

  test("rejects unauthenticated callers before touching the database", async () => {
    const ctx = createMockContext({ session: null });
    const caller = createCaller(ctx);
    await assert.rejects(caller.organizationQuery({ slug: "acme" }), /You must be logged in/);
    assert.strictEqual(ctx.db.query.organization.findFirst.mock.callCount(), 0);
  });

  test("rejects an empty slug at the input boundary", async () => {
    const caller = createCaller(memberContext());
    await assert.rejects(caller.organizationQuery({ slug: "" }), ORPCError);
  });
});

describe("publicProcedure", () => {
  test("allows unauthenticated access", async () => {
    const caller = createCaller(createMockContext({ session: null }));
    const result = await caller.publicQuery();
    assert.strictEqual(result.hasSession, false);
  });

  test("passes session through when authenticated", async () => {
    const caller = createCaller(createMockContext());
    const result = await caller.publicQuery();
    assert.strictEqual(result.hasSession, true);
  });
});
