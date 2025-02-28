import { and, desc, eq, lt, or } from "@init/db";
import { messages } from "@init/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { createMessageInput, getMessagesInput } from "./message-schema";

export const messageRouter = createTRPCRouter({
  createMessage: protectedProcedure
    .input(createMessageInput)
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(messages)
        .values({
          content: input.content,
          role: input.role ?? "app",
          teamId: input.teamId,
          userId: ctx.user.id,
        })
        .returning();

      return {
        message: created,
      };
    }),

  getMessages: protectedProcedure
    .input(getMessagesInput)
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;

      const results = await ctx.db
        .select()
        .from(messages)
        .where(
          and(
            input.cursor
              ? or(
                  lt(messages.createdAt, input.cursor.createdAt),
                  and(
                    eq(messages.createdAt, input.cursor.createdAt),
                    lt(messages.id, input.cursor.postId),
                  ),
                )
              : undefined,
            input.teamId ? eq(messages.teamId, input.teamId) : undefined,
          ),
        )
        .orderBy(desc(messages.createdAt), desc(messages.id))
        .limit(limit + 1);

      let nextCursor: typeof input.cursor = undefined;
      if (results.length > limit) {
        const nextItem = results.pop();
        if (nextItem?.id) {
          nextCursor = {
            postId: nextItem.id,
            createdAt: nextItem.createdAt,
          };
        }
      }

      return {
        data: results,
        nextCursor,
      };
    }),
});
