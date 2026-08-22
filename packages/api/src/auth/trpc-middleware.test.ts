import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { TRPCError } from "@trpc/server";

import { createMockContext } from "../test-utils";
import {
  createCallerFactory,
  createTRPCRouter,
  organizationProcedure,
  protectedProcedure,
  publicProcedure,
} from "../trpc";

const ORG = { id: "org-1", name: "Acme", slug: "acme", logo: null, metadata: null };
const MEMBERSHIP = { id: "mem-1", organizationId: "org-1", userId: "user-1", role: "owner" };

const testRouter = createTRPCRouter({
  protectedQuery: protectedProcedure.query(({ ctx }) => ({
    userId: ctx.session.user.id,
  })),
  publicQuery: publicProcedure.query(({ ctx }) => ({
    hasSession: ctx.session !== null,
  })),
  publicMutation: publicProcedure.mutation(() => ({ ok: true })),
  organizationQuery: organizationProcedure.query(({ ctx }) => ({
    organizationId: ctx.organization.id,
    role: ctx.membership.role,
  })),
});

const createCaller = createCallerFactory(testRouter);

describe("protectedProcedure", () => {
  test("provides non-nullable session to handler", async () => {
    const caller = createCaller(createMockContext());
    const result = await caller.protectedQuery();
    assert.strictEqual(result.userId, "user-1");
  });

  test("rejects unauthenticated users with UNAUTHORIZED", async () => {
    const caller = createCaller(createMockContext({ session: null }));
    await assert.rejects(caller.protectedQuery(), TRPCError);
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
    await assert.rejects(caller.organizationQuery({ slug: "" }), TRPCError);
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

describe("cross-origin mutation guard", () => {
  test("allows a mutation the browser labels same-origin", async () => {
    const caller = createCaller(createMockContext({ secFetchSite: "same-origin" }));
    assert.deepEqual(await caller.publicMutation(), { ok: true });
  });

  test("allows a user-initiated mutation (Sec-Fetch-Site: none)", async () => {
    const caller = createCaller(createMockContext({ secFetchSite: "none" }));
    assert.deepEqual(await caller.publicMutation(), { ok: true });
  });

  test("allows a mutation whose Origin matches the app", async () => {
    const caller = createCaller(createMockContext({ origin: "http://localhost:3000" }));
    assert.deepEqual(await caller.publicMutation(), { ok: true });
  });

  test("allows a non-browser mutation with no Origin or Sec-Fetch-Site", async () => {
    const caller = createCaller(createMockContext());
    assert.deepEqual(await caller.publicMutation(), { ok: true });
  });

  test("rejects a mutation the browser labels cross-site", async () => {
    const caller = createCaller(
      createMockContext({ secFetchSite: "cross-site", origin: "https://evil.example" }),
    );
    await assert.rejects(caller.publicMutation(), /Cross-origin request rejected/);
  });

  test("rejects a mutation from an untrusted Origin when Sec-Fetch-Site is absent", async () => {
    const caller = createCaller(createMockContext({ origin: "https://evil.example" }));
    await assert.rejects(caller.publicMutation(), /Cross-origin request rejected/);
  });

  test("rejects a cross-site mutation even if the Origin header is stripped", async () => {
    const caller = createCaller(createMockContext({ secFetchSite: "cross-site", origin: null }));
    await assert.rejects(caller.publicMutation(), /Cross-origin request rejected/);
  });

  test("does not guard queries, only mutations", async () => {
    const caller = createCaller(
      createMockContext({ secFetchSite: "cross-site", origin: "https://evil.example" }),
    );
    assert.deepEqual(await caller.publicQuery(), { hasSession: true });
  });
});
