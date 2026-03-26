import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";

import { createMockContext } from "../test-utils";
import { createCallerFactory, createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

const testRouter = createTRPCRouter({
  protectedQuery: protectedProcedure.query(({ ctx }) => ({
    userId: ctx.session.user.id,
  })),
  publicQuery: publicProcedure.query(({ ctx }) => ({
    hasSession: ctx.session !== null,
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
