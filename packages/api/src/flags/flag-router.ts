import { createTRPCRouter, publicProcedure } from "../trpc";

export const flagRouter = createTRPCRouter({
  /**
   * The resolved flag set for this deployment. Public because flags gate UI as
   * well as server behaviour, and the client needs the same answer the server
   * has — never put a secret behind a flag name.
   */
  list: publicProcedure.query(({ ctx }) => ({ flags: ctx.flags })),
});
