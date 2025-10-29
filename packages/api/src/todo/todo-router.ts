import { and, eq } from "@repo/db";
import { todo } from "@repo/db/drizzle-schema";
import { TRPCError } from "@trpc/server";

import type { TRPCContext } from "../trpc";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  createTodoInput,
  deleteTodoInput,
  todoSlugInput,
  updateTodoInput,
} from "./todo-schema";

const ensureOrganizationAccess = async (ctx: TRPCContext, slug: string) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  const userId = ctx.session.user.id;

  const organization = await ctx.db.query.organization.findFirst({
    where: (org, { eq }) => eq(org.slug, slug),
  });

  if (!organization) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found",
    });
  }

  const membership = await ctx.db.query.member.findFirst({
    where: (member, { and, eq }) =>
      and(
        eq(member.organizationId, organization.id),
        eq(member.userId, userId),
      ),
  });

  if (!membership) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You do not have access to this organization",
    });
  }

  return organization;
};

export const todoRouter = createTRPCRouter({
  list: protectedProcedure
    .input(todoSlugInput)
    .query(async ({ ctx, input }) => {
      const organization = await ensureOrganizationAccess(ctx, input.slug);

      const todos = await ctx.db.query.todo.findMany({
        where: (todoTable, { eq }) =>
          eq(todoTable.organizationId, organization.id),
        orderBy: (todoTable, { desc }) => desc(todoTable.createdAt),
      });

      return { todos };
    }),
  create: protectedProcedure
    .input(createTodoInput)
    .mutation(async ({ ctx, input }) => {
      const organization = await ensureOrganizationAccess(ctx, input.slug);

      const [createdTodo] = await ctx.db
        .insert(todo)
        .values({
          organizationId: organization.id,
          title: input.title,
        })
        .returning();

      return { todo: createdTodo };
    }),
  update: protectedProcedure
    .input(updateTodoInput)
    .mutation(async ({ ctx, input }) => {
      const organization = await ensureOrganizationAccess(ctx, input.slug);

      const updateData: Record<string, unknown> = {
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
        .where(
          and(eq(todo.id, input.id), eq(todo.organizationId, organization.id)),
        )
        .returning();

      if (!updatedTodo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Todo not found",
        });
      }

      return { todo: updatedTodo };
    }),
  delete: protectedProcedure
    .input(deleteTodoInput)
    .mutation(async ({ ctx, input }) => {
      const organization = await ensureOrganizationAccess(ctx, input.slug);

      const [deletedTodo] = await ctx.db
        .delete(todo)
        .where(
          and(eq(todo.id, input.id), eq(todo.organizationId, organization.id)),
        )
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
