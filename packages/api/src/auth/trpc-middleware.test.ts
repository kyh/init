import { describe, expect, it } from "vitest";
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
  organizationQuery: organizationProcedure.query(({ ctx }) => ({
    organizationId: ctx.organization.id,
    role: ctx.membership.role,
  })),
});

const createCaller = createCallerFactory(testRouter);

describe("protectedProcedure", () => {
  it("provides non-nullable session to handler", async () => {
    const caller = createCaller(createMockContext());
    const result = await caller.protectedQuery();
    expect(result.userId).toBe("user-1");
  });

  it("rejects unauthenticated users with UNAUTHORIZED", async () => {
    const caller = createCaller(createMockContext({ session: null }));
    await expect(caller.protectedQuery()).rejects.toThrow(TRPCError);
    await expect(caller.protectedQuery()).rejects.toThrow("You must be logged in");
  });
});

describe("organizationProcedure", () => {
  const memberContext = () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mockResolvedValue(ORG);
    ctx.db.query.member.findFirst.mockResolvedValue(MEMBERSHIP);
    return ctx;
  };

  it("provides the resolved organization and membership to the handler", async () => {
    const caller = createCaller(memberContext());
    const result = await caller.organizationQuery({ slug: "acme" });
    expect(result).toEqual({ organizationId: "org-1", role: "owner" });
  });

  it("rejects a non-member with UNAUTHORIZED without running the handler", async () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mockResolvedValue(ORG);
    ctx.db.query.member.findFirst.mockResolvedValue(undefined);

    const caller = createCaller(ctx);
    await expect(caller.organizationQuery({ slug: "acme" })).rejects.toThrow(
      "You do not have access to this organization",
    );
  });

  it("reports a missing organization as NOT_FOUND, distinct from non-membership", async () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mockResolvedValue(undefined);

    const caller = createCaller(ctx);
    await expect(caller.organizationQuery({ slug: "nope" })).rejects.toThrow(
      "Organization not found",
    );
    expect(ctx.db.query.member.findFirst).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated callers before touching the database", async () => {
    const ctx = createMockContext({ session: null });
    const caller = createCaller(ctx);
    await expect(caller.organizationQuery({ slug: "acme" })).rejects.toThrow(
      "You must be logged in",
    );
    expect(ctx.db.query.organization.findFirst).not.toHaveBeenCalled();
  });

  it("rejects an empty slug at the input boundary", async () => {
    const caller = createCaller(memberContext());
    await expect(caller.organizationQuery({ slug: "" })).rejects.toThrow(TRPCError);
  });
});

describe("publicProcedure", () => {
  it("allows unauthenticated access", async () => {
    const caller = createCaller(createMockContext({ session: null }));
    const result = await caller.publicQuery();
    expect(result.hasSession).toBe(false);
  });

  it("passes session through when authenticated", async () => {
    const caller = createCaller(createMockContext());
    const result = await caller.publicQuery();
    expect(result.hasSession).toBe(true);
  });
});
