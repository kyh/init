import { todo } from "@repo/db/drizzle-schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

import { createTRPCRouter, organizationProcedure } from "../trpc";
import { createTodoInput, deleteTodoInput, updateTodoInput } from "./todo-schema";

export const todoRouter = createTRPCRouter({
  list: organizationProcedure.query(async ({ ctx }) => {
    const todos = await ctx.db.query.todo.findMany({
      where: (todoTable, { eq }) => eq(todoTable.organizationId, ctx.organization.id),
      orderBy: (todoTable, { desc }) => desc(todoTable.createdAt),
    });

    return { todos };
  }),
  create: organizationProcedure.input(createTodoInput).mutation(async ({ ctx, input }) => {
    const [createdTodo] = await ctx.db
      .insert(todo)
      .values({
        organizationId: ctx.organization.id,
        title: input.title,
      })
      .returning();

    return { todo: createdTodo };
  }),
  update: organizationProcedure.input(updateTodoInput).mutation(async ({ ctx, input }) => {
    const updateData: Partial<typeof todo.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.completed !== undefined) {
      updateData.completed = input.completed;
    }

    const [updatedTodo] = await ctx.db
      .update(todo)
      .set(updateData)
      .where(and(eq(todo.id, input.id), eq(todo.organizationId, ctx.organization.id)))
      .returning();

    if (!updatedTodo) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Todo not found",
      });
    }

    return { todo: updatedTodo };
  }),
  delete: organizationProcedure.input(deleteTodoInput).mutation(async ({ ctx, input }) => {
    const [deletedTodo] = await ctx.db
      .delete(todo)
      .where(and(eq(todo.id, input.id), eq(todo.organizationId, ctx.organization.id)))
      .returning();

    if (!deletedTodo) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Todo not found",
      });
    }

    return { todo: deletedTodo };
  }),
});
