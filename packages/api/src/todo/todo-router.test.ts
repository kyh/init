import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { createMockChain, createMockContext, createMockDb } from "../test-utils";
import { createCallerFactory } from "../trpc";
import { todoRouter } from "./todo-router";

const createCaller = createCallerFactory(todoRouter);

const ORG = { id: "org-1", name: "Acme", slug: "acme", createdAt: new Date(), metadata: null };
const MEMBERSHIP = { id: "mem-1", organizationId: "org-1", userId: "user-1", role: "owner" };
const TODO_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

function authedContext(dbOverrides?: Partial<ReturnType<typeof createMockDb>>) {
  const ctx = createMockContext();
  ctx.db.query.organization.findFirst.mock.mockImplementation(() => Promise.resolve(ORG));
  ctx.db.query.member.findFirst.mock.mockImplementation(() => Promise.resolve(MEMBERSHIP));
  if (dbOverrides) Object.assign(ctx.db, dbOverrides);
  return ctx;
}

describe("todoRouter.list", () => {
  test("returns todos for an organization the user belongs to", async () => {
    const ctx = authedContext();
    const todos = [
      { id: "t1", title: "First", completed: false, organizationId: "org-1" },
      { id: "t2", title: "Second", completed: true, organizationId: "org-1" },
    ];
    ctx.db.query.todo.findMany.mock.mockImplementation(() => Promise.resolve(todos));

    const caller = createCaller(ctx);
    const result = await caller.list({ slug: "acme" });

    assert.deepEqual(result.todos, todos);
    assert.strictEqual(ctx.db.query.todo.findMany.mock.callCount(), 1);
  });

  test("returns empty array when org has no todos", async () => {
    const ctx = authedContext();
    ctx.db.query.todo.findMany.mock.mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(ctx);
    const result = await caller.list({ slug: "acme" });

    assert.deepEqual(result.todos, []);
  });

  test("throws NOT_FOUND when organization does not exist", async () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mock.mockImplementation(() => Promise.resolve(undefined));

    const caller = createCaller(ctx);
    await assert.rejects(caller.list({ slug: "nonexistent" }), /Organization not found/);
  });

  test("throws UNAUTHORIZED when user is not a member", async () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mock.mockImplementation(() => Promise.resolve(ORG));
    ctx.db.query.member.findFirst.mock.mockImplementation(() => Promise.resolve(undefined));

    const caller = createCaller(ctx);
    await assert.rejects(
      caller.list({ slug: "acme" }),
      /You do not have access to this organization/,
    );
  });

  test("throws UNAUTHORIZED when not logged in", async () => {
    const ctx = createMockContext({ session: null });
    const caller = createCaller(ctx);
    await assert.rejects(caller.list({ slug: "acme" }), /You must be logged in/);
  });
});

describe("todoRouter.create", () => {
  test("inserts a todo and returns it", async () => {
    const ctx = authedContext();
    const created = { id: TODO_ID, title: "New todo", completed: false, organizationId: "org-1" };
    const chain = createMockChain([created]);
    ctx.db.insert.mock.mockImplementation(() => chain);

    const caller = createCaller(ctx);
    const result = await caller.create({ slug: "acme", title: "New todo" });

    assert.deepEqual(result.todo, created);
    assert.strictEqual(ctx.db.insert.mock.callCount(), 1);
    assert.deepEqual(chain.values.mock.calls[0]?.arguments, [
      { organizationId: "org-1", title: "New todo" },
    ]);
  });

  test("rejects empty title", async () => {
    const ctx = authedContext();
    const caller = createCaller(ctx);
    await assert.rejects(caller.create({ slug: "acme", title: "" }));
  });
});

describe("todoRouter.update", () => {
  test("updates title", async () => {
    const ctx = authedContext();
    const updated = { id: TODO_ID, title: "Updated", completed: false, organizationId: "org-1" };
    const chain = createMockChain([updated]);
    ctx.db.update.mock.mockImplementation(() => chain);

    const caller = createCaller(ctx);
    const result = await caller.update({ slug: "acme", id: TODO_ID, title: "Updated" });

    assert.deepEqual(result.todo, updated);
    assert.partialDeepStrictEqual(chain.set.mock.calls[0]?.arguments[0], { title: "Updated" });
  });

  test("updates completed status", async () => {
    const ctx = authedContext();
    const updated = { id: TODO_ID, title: "Task", completed: true, organizationId: "org-1" };
    const chain = createMockChain([updated]);
    ctx.db.update.mock.mockImplementation(() => chain);

    const caller = createCaller(ctx);
    const result = await caller.update({ slug: "acme", id: TODO_ID, completed: true });

    assert.strictEqual(result.todo?.completed, true);
    assert.partialDeepStrictEqual(chain.set.mock.calls[0]?.arguments[0], { completed: true });
  });

  test("throws NOT_FOUND when todo does not exist", async () => {
    const ctx = authedContext();
    const chain = createMockChain();
    ctx.db.update.mock.mockImplementation(() => chain);

    const caller = createCaller(ctx);
    await assert.rejects(
      caller.update({ slug: "acme", id: TODO_ID, title: "Nope" }),
      /Todo not found/,
    );
  });
});

describe("todoRouter.delete", () => {
  test("deletes a todo and returns it", async () => {
    const ctx = authedContext();
    const deleted = { id: TODO_ID, title: "Gone", completed: false, organizationId: "org-1" };
    const chain = createMockChain([deleted]);
    ctx.db.delete.mock.mockImplementation(() => chain);

    const caller = createCaller(ctx);
    const result = await caller.delete({ slug: "acme", id: TODO_ID });

    assert.deepEqual(result.todo, deleted);
    assert.strictEqual(ctx.db.delete.mock.callCount(), 1);
  });

  test("throws NOT_FOUND when todo does not exist", async () => {
    const ctx = authedContext();
    const chain = createMockChain();
    ctx.db.delete.mock.mockImplementation(() => chain);

    const caller = createCaller(ctx);
    await assert.rejects(caller.delete({ slug: "acme", id: TODO_ID }), /Todo not found/);
  });
});
