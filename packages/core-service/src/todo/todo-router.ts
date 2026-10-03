import { todo } from "@repo/db/drizzle-schema";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";

import { os, requireOrganization, requireSession } from "../orpc";

const authed = os.todo.use(requireSession);

export const todoRouter = {
  create: authed.create.use(requireOrganization).handler(async ({ context, input }) => {
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
  delete: authed.delete.use(requireOrganization).handler(async ({ context, input }) => {
    const [deletedTodo] = await context.db
      .delete(todo)
      .where(and(eq(todo.id, input.id), eq(todo.organizationId, context.organization.id)))
      .returning();

    if (!deletedTodo) {
      throw new ORPCError("NOT_FOUND", { message: "Todo not found" });
    }

    return { todo: deletedTodo };
  }),
  list: authed.list.use(requireOrganization).handler(async ({ context }) => {
    const todos = await context.db.query.todo.findMany({
      orderBy: { createdAt: "desc" },
      where: { organizationId: context.organization.id },
    });

    return { todos };
  }),
  update: authed.update.use(requireOrganization).handler(async ({ context, input }) => {
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
