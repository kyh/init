import { createTRPCRouter, protectedProcedure } from "../trpc";
import { listMemberUserInput } from "./organization-schema";

export const organizationRouter = createTRPCRouter({
  /**
   * Get a list of users by their userIds
   */
  listMemberUser: protectedProcedure
    .input(listMemberUserInput)
    .query(async ({ ctx, input }) => {
      const { userIds } = input;

      if (userIds.length === 0) {
        return { users: [] };
      }

      const users = await ctx.db.query.user.findMany({
        where: (user, { inArray }) => inArray(user.id, userIds),
      });

      return { users };
    }),
});
