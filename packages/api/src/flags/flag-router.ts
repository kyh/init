import { publicProcedure } from "../orpc";

export const flagRouter = {
  /**
   * The resolved flag set for this deployment. Public because flags gate UI as
   * well as server behaviour and the client needs the same answer the server
   * has — so never put a secret behind a flag name.
   */
  list: publicProcedure.handler(({ context }) => ({ flags: context.flags })),
};
