import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createRouterClient } from "@orpc/server";
import { todo } from "@repo/db/drizzle-schema";

import { createMemberContext, databaseRows } from "../test-utils";
import { todoRouter } from "./todo-router";

const TODO = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  organizationId: "org-1",
  title: "First",
  description: null,
  completed: false,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
} satisfies typeof todo.$inferSelect;

describe("todoRouter", () => {
  test("lists only the resolved organization's todos, newest first", async () => {
    const context = createMemberContext();
    context.responses.push(databaseRows(todo, TODO));
    const caller = createRouterClient(todoRouter, { context });

    assert.deepEqual(await caller.list({ slug: "acme" }), { todos: [TODO] });
    const query = context.query.mock.calls[2];
    assert.ok(query);
    assert.match(
      query.arguments[0],
      /where "todo"\."organization_id" = \$1 order by "todo"\."created_at" desc/,
    );
    assert.deepEqual(query.arguments[1], ["org-1"]);
  });

  test("creates a trimmed todo in the resolved organization", async () => {
    const context = createMemberContext();
    context.responses.push(databaseRows(todo, TODO));
    const caller = createRouterClient(todoRouter, { context });

    assert.deepEqual(await caller.create({ slug: "acme", title: " First " }), { todo: TODO });
    assert.deepEqual(context.query.mock.calls[2]?.arguments[1], ["org-1", "First"]);
  });

  test("rejects a blank title before querying", async () => {
    const context = createMemberContext();
    const caller = createRouterClient(todoRouter, { context });

    await assert.rejects(caller.create({ slug: "acme", title: "  " }), { code: "BAD_REQUEST" });
    assert.equal(context.query.mock.callCount(), 0);
  });

  test("updates a title without overwriting completed, scoped by todo and organization", async () => {
    const context = createMemberContext();
    context.responses.push(databaseRows(todo, { ...TODO, title: "Updated" }));
    const caller = createRouterClient(todoRouter, { context });

    const result = await caller.update({ slug: "acme", id: TODO.id, title: "Updated" });
    assert.equal(result.todo.title, "Updated");
    const query = context.query.mock.calls[2];
    assert.ok(query);
    assert.match(
      query.arguments[0],
      /set "title" = \$1, "updated_at" = \$2 where \("todo"\."id" = \$3 and "todo"\."organization_id" = \$4\)/,
    );
    assert.equal(query.arguments[1][0], "Updated");
    assert.deepEqual(query.arguments[1].slice(2), [TODO.id, "org-1"]);
  });

  test("updates completed without overwriting the title", async () => {
    const context = createMemberContext();
    context.responses.push(databaseRows(todo, { ...TODO, completed: true }));
    const caller = createRouterClient(todoRouter, { context });

    const result = await caller.update({ slug: "acme", id: TODO.id, completed: true });
    assert.equal(result.todo.completed, true);
    const query = context.query.mock.calls[2];
    assert.ok(query);
    assert.match(query.arguments[0], /set "completed" = \$1, "updated_at" = \$2/);
    assert.equal(query.arguments[1][0], true);
  });

  test("rejects an empty update before querying", async () => {
    const context = createMemberContext();
    const caller = createRouterClient(todoRouter, { context });

    await assert.rejects(caller.update({ slug: "acme", id: TODO.id }), { code: "BAD_REQUEST" });
    assert.equal(context.query.mock.callCount(), 0);
  });

  test("deletes only a todo in the resolved organization", async () => {
    const context = createMemberContext();
    context.responses.push(databaseRows(todo, TODO));
    const caller = createRouterClient(todoRouter, { context });

    assert.deepEqual(await caller.delete({ slug: "acme", id: TODO.id }), { todo: TODO });
    const query = context.query.mock.calls[2];
    assert.ok(query);
    assert.match(
      query.arguments[0],
      /where \("todo"\."id" = \$1 and "todo"\."organization_id" = \$2\)/,
    );
    assert.deepEqual(query.arguments[1], [TODO.id, "org-1"]);
  });

  test("reports NOT_FOUND when update or delete matches no tenant-owned todo", async () => {
    const operations: Array<"update" | "delete"> = ["update", "delete"];
    for (const operation of operations) {
      const context = createMemberContext();
      context.responses.push([]);
      const caller = createRouterClient(todoRouter, { context });
      await assert.rejects(caller[operation]({ slug: "acme", id: TODO.id, title: "Missing" }), {
        code: "NOT_FOUND",
      });
    }
  });
});
