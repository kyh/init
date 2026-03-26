import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

import { createMockContext, createMockDb } from "../test-utils";
import { createCallerFactory } from "../trpc";
import { todoRouter } from "./todo-router";

const createCaller = createCallerFactory(todoRouter);

const ORG = { id: "org-1", name: "Acme", slug: "acme", createdAt: new Date(), metadata: null };
const MEMBERSHIP = { id: "mem-1", organizationId: "org-1", userId: "user-1", role: "owner" };
const TODO_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

function authedContext(dbOverrides?: Partial<ReturnType<typeof createMockDb>>) {
  const ctx = createMockContext();
  ctx.db.query.organization.findFirst.mockResolvedValue(ORG);
  ctx.db.query.member.findFirst.mockResolvedValue(MEMBERSHIP);
  if (dbOverrides) Object.assign(ctx.db, dbOverrides);
  return ctx;
}

describe("todoRouter.list", () => {
  it("returns todos for an organization the user belongs to", async () => {
    const ctx = authedContext();
    const todos = [
      { id: "t1", title: "First", completed: false, organizationId: "org-1" },
      { id: "t2", title: "Second", completed: true, organizationId: "org-1" },
    ];
    ctx.db.query.todo.findMany.mockResolvedValue(todos);

    const caller = createCaller(ctx);
    const result = await caller.list({ slug: "acme" });

    expect(result.todos).toEqual(todos);
    expect(ctx.db.query.todo.findMany).toHaveBeenCalledOnce();
  });

  it("returns empty array when org has no todos", async () => {
    const ctx = authedContext();
    ctx.db.query.todo.findMany.mockResolvedValue([]);

    const caller = createCaller(ctx);
    const result = await caller.list({ slug: "acme" });

    expect(result.todos).toEqual([]);
  });

  it("throws NOT_FOUND when organization does not exist", async () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mockResolvedValue(undefined);

    const caller = createCaller(ctx);
    await expect(caller.list({ slug: "nonexistent" })).rejects.toThrow("Organization not found");
  });

  it("throws UNAUTHORIZED when user is not a member", async () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mockResolvedValue(ORG);
    ctx.db.query.member.findFirst.mockResolvedValue(undefined);

    const caller = createCaller(ctx);
    await expect(caller.list({ slug: "acme" })).rejects.toThrow(
      "You do not have access to this organization",
    );
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const ctx = createMockContext({ session: null });
    const caller = createCaller(ctx);
    await expect(caller.list({ slug: "acme" })).rejects.toThrow("You must be logged in");
  });
});

describe("todoRouter.create", () => {
  it("inserts a todo and returns it", async () => {
    const ctx = authedContext();
    const created = { id: TODO_ID, title: "New todo", completed: false, organizationId: "org-1" };
    const chain = { values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([created]) };
    ctx.db.insert.mockReturnValue(chain);

    const caller = createCaller(ctx);
    const result = await caller.create({ slug: "acme", title: "New todo" });

    expect(result.todo).toEqual(created);
    expect(ctx.db.insert).toHaveBeenCalledOnce();
    expect(chain.values).toHaveBeenCalledWith({
      organizationId: "org-1",
      title: "New todo",
    });
  });

  it("rejects empty title", async () => {
    const ctx = authedContext();
    const caller = createCaller(ctx);
    await expect(caller.create({ slug: "acme", title: "" })).rejects.toThrow();
  });
});

describe("todoRouter.update", () => {
  it("updates title", async () => {
    const ctx = authedContext();
    const updated = { id: TODO_ID, title: "Updated", completed: false, organizationId: "org-1" };
    const chain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([updated]),
    };
    ctx.db.update.mockReturnValue(chain);

    const caller = createCaller(ctx);
    const result = await caller.update({ slug: "acme", id: TODO_ID, title: "Updated" });

    expect(result.todo).toEqual(updated);
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Updated" }),
    );
  });

  it("updates completed status", async () => {
    const ctx = authedContext();
    const updated = { id: TODO_ID, title: "Task", completed: true, organizationId: "org-1" };
    const chain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([updated]),
    };
    ctx.db.update.mockReturnValue(chain);

    const caller = createCaller(ctx);
    const result = await caller.update({ slug: "acme", id: TODO_ID, completed: true });

    expect(result.todo?.completed).toBe(true);
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ completed: true }),
    );
  });

  it("throws NOT_FOUND when todo does not exist", async () => {
    const ctx = authedContext();
    const chain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };
    ctx.db.update.mockReturnValue(chain);

    const caller = createCaller(ctx);
    await expect(
      caller.update({ slug: "acme", id: TODO_ID, title: "Nope" }),
    ).rejects.toThrow("Todo not found");
  });
});

describe("todoRouter.delete", () => {
  it("deletes a todo and returns it", async () => {
    const ctx = authedContext();
    const deleted = { id: TODO_ID, title: "Gone", completed: false, organizationId: "org-1" };
    const chain = {
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([deleted]),
    };
    ctx.db.delete.mockReturnValue(chain);

    const caller = createCaller(ctx);
    const result = await caller.delete({ slug: "acme", id: TODO_ID });

    expect(result.todo).toEqual(deleted);
    expect(ctx.db.delete).toHaveBeenCalledOnce();
  });

  it("throws NOT_FOUND when todo does not exist", async () => {
    const ctx = authedContext();
    const chain = {
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };
    ctx.db.delete.mockReturnValue(chain);

    const caller = createCaller(ctx);
    await expect(
      caller.delete({ slug: "acme", id: TODO_ID }),
    ).rejects.toThrow("Todo not found");
  });
});
