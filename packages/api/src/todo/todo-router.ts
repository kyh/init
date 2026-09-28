import { todo } from "@repo/db/drizzle-schema";
import { openapi } from "@orpc/openapi";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { organizationProcedure } from "../orpc";
import { organizationInput } from "../organization/organization-schema";
import { createTodoInput, deleteTodoInput, updateTodoInput } from "./todo-schema";

const todoRow = createSelectSchema(todo);
const todoOutput = z.object({ todo: todoRow });

export const todoRouter = {
  create: organizationProcedure(createTodoInput)
    .meta(
      openapi({
        description:
          "Creates an incomplete todo in the organization named by `slug`. The title is trimmed and must be 1-255 characters.",
        summary: "Create a todo",
        tags: ["Todo"],
      }),
    )
    .output(todoOutput)
    .handler(async ({ context, input }) => {
      const [createdTodo] = await context.db
        .insert(todo)
        .values({
          organizationId: context.organization.id,
          title: input.title,
        })
        .returning();

      if (!createdTodo) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Todo was not created" });
      }

      return { todo: createdTodo };
    }),
  delete: organizationProcedure(deleteTodoInput)
    .meta(
      openapi({
        description:
          "Permanently deletes a todo by `id` and returns the deleted row. Answers NOT_FOUND if no todo with that id belongs to the organization.",
        summary: "Delete a todo",
        tags: ["Todo"],
      }),
    )
    .output(todoOutput)
    .handler(async ({ context, input }) => {
      const [deletedTodo] = await context.db
        .delete(todo)
        .where(and(eq(todo.id, input.id), eq(todo.organizationId, context.organization.id)))
        .returning();

      if (!deletedTodo) {
        throw new ORPCError("NOT_FOUND", { message: "Todo not found" });
      }

      return { todo: deletedTodo };
    }),
  list: organizationProcedure(organizationInput)
    .meta(
      openapi({
        description: "Lists every todo in the organization named by `slug`, newest first.",
        summary: "List todos",
        tags: ["Todo"],
      }),
    )
    .output(z.object({ todos: z.array(todoRow) }))
    .handler(async ({ context }) => {
      const todos = await context.db.query.todo.findMany({
        orderBy: { createdAt: "desc" },
        where: { organizationId: context.organization.id },
      });

      return { todos };
    }),
  update: organizationProcedure(updateTodoInput)
    .meta(
      openapi({
        description:
          "Changes a todo's `title`, `completed`, or both; fields left out keep their value, and at least one is required. Answers NOT_FOUND if no todo with that id belongs to the organization.",
        summary: "Update a todo",
        tags: ["Todo"],
      }),
    )
    .output(todoOutput)
    .handler(async ({ context, input }) => {
      const [updatedTodo] = await context.db
        .update(todo)
        .set({ completed: input.completed, title: input.title })
        .where(and(eq(todo.id, input.id), eq(todo.organizationId, context.organization.id)))
        .returning();

      if (!updatedTodo) {
        throw new ORPCError("NOT_FOUND", { message: "Todo not found" });
      }

      return { todo: updatedTodo };
    }),
};
