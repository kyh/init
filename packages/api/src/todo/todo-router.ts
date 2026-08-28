import { todo } from "@repo/db/drizzle-schema";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";

import { organizationProcedure } from "../orpc";
import { organizationInput } from "../organization/organization-schema";
import { createTodoInput, deleteTodoInput, updateTodoInput } from "./todo-schema";

export const todoRouter = {
  list: organizationProcedure(organizationInput).handler(async ({ context }) => {
    const todos = await context.db.query.todo.findMany({
      where: (todoTable, { eq }) => eq(todoTable.organizationId, context.organization.id),
      orderBy: (todoTable, { desc }) => desc(todoTable.createdAt),
    });

    return { todos };
  }),
  create: organizationProcedure(createTodoInput).handler(async ({ context, input }) => {
    const [createdTodo] = await context.db
      .insert(todo)
      .values({
        organizationId: context.organization.id,
        title: input.title,
      })
      .returning();

    return { todo: createdTodo };
  }),
  update: organizationProcedure(updateTodoInput).handler(async ({ context, input }) => {
    // updatedAt is maintained by the column's $onUpdate — see drizzle-schema.ts
    const updateData: Partial<typeof todo.$inferInsert> = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.completed !== undefined) {
      updateData.completed = input.completed;
    }

    const [updatedTodo] = await context.db
      .update(todo)
      .set(updateData)
      .where(and(eq(todo.id, input.id), eq(todo.organizationId, context.organization.id)))
      .returning();

    if (!updatedTodo) {
      throw new ORPCError("NOT_FOUND", { message: "Todo not found" });
    }

    return { todo: updatedTodo };
  }),
  delete: organizationProcedure(deleteTodoInput).handler(async ({ context, input }) => {
    const [deletedTodo] = await context.db
      .delete(todo)
      .where(and(eq(todo.id, input.id), eq(todo.organizationId, context.organization.id)))
      .returning();

    if (!deletedTodo) {
      throw new ORPCError("NOT_FOUND", { message: "Todo not found" });
    }

    return { todo: deletedTodo };
  }),
};
