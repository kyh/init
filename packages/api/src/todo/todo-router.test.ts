import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createRouterClient } from "@orpc/server";
import { todo } from "@repo/db/drizzle-schema";

import { createMemberContext, databaseRows } from "../test-utils";
import { todoRouter } from "./todo-router";

const TODO = {
  completed: false,
  createdAt: new Date("2024-01-01"),
  description: null,
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  organizationId: "org-1",
  title: "First",
  updatedAt: new Date("2024-01-01"),
} satisfies typeof todo.$inferSelect;

describe("todoRouter", () => {
  test("lists only the resolved organization's todos, newest first", async () => {
    const context = createMemberContext();
    context.responses.push(databaseRows(todo, TODO));
    const caller = createRouterClient(todoRouter, { context });

    assert.deepEqual(await caller.list({ slug: "acme" }), { todos: [TODO] });
    const query = context.query.mock.calls.at(2);
    assert.ok(query);
    assert.match(
      query.arguments[0],
      /where "todo"\."organization_id" = \$1 order by "todo"\."created_at" desc/u,
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

    const result = await caller.update({ id: TODO.id, slug: "acme", title: "Updated" });
    assert.equal(result.todo.title, "Updated");
    const query = context.query.mock.calls.at(2);
    assert.ok(query);
    assert.match(
      query.arguments[0],
      /set "title" = \$1, "updated_at" = \$2 where \("todo"\."id" = \$3 and "todo"\."organization_id" = \$4\)/u,
    );
    assert.equal(query.arguments[1][0], "Updated");
    assert.deepEqual(query.arguments[1].slice(2), [TODO.id, "org-1"]);
  });

  test("updates completed without overwriting the title", async () => {
    const context = createMemberContext();
    context.responses.push(databaseRows(todo, { ...TODO, completed: true }));
    const caller = createRouterClient(todoRouter, { context });

    const result = await caller.update({ completed: true, id: TODO.id, slug: "acme" });
    assert.equal(result.todo.completed, true);
    const query = context.query.mock.calls.at(2);
    assert.ok(query);
    assert.match(query.arguments[0], /set "completed" = \$1, "updated_at" = \$2/u);
    assert.equal(query.arguments[1][0], true);
  });

  test("rejects an empty update before querying", async () => {
    const context = createMemberContext();
    const caller = createRouterClient(todoRouter, { context });

    await assert.rejects(caller.update({ id: TODO.id, slug: "acme" }), { code: "BAD_REQUEST" });
    assert.equal(context.query.mock.callCount(), 0);
  });

  test("deletes only a todo in the resolved organization", async () => {
    const context = createMemberContext();
    context.responses.push(databaseRows(todo, TODO));
    const caller = createRouterClient(todoRouter, { context });

    assert.deepEqual(await caller.delete({ id: TODO.id, slug: "acme" }), { todo: TODO });
    const query = context.query.mock.calls.at(2);
    assert.ok(query);
    assert.match(
      query.arguments[0],
      /where \("todo"\."id" = \$1 and "todo"\."organization_id" = \$2\)/u,
    );
    assert.deepEqual(query.arguments[1], [TODO.id, "org-1"]);
  });

  test("reports NOT_FOUND when update or delete matches no tenant-owned todo", async () => {
    const operations: ("update" | "delete")[] = ["update", "delete"];
    for (const operation of operations) {
      const context = createMemberContext();
      context.responses.push([]);
      const caller = createRouterClient(todoRouter, { context });
      await assert.rejects(caller[operation]({ id: TODO.id, slug: "acme", title: "Missing" }), {
        code: "NOT_FOUND",
      });
    }
  });
});
