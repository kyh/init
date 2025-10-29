import { organizationRouter } from "./organization/organization-router";
import { todoRouter } from "./todo/todo-router";
import { createTRPCRouter } from "./trpc";
import { waitlistRouter } from "./waitlist/waitlist-router";

export const appRouter = createTRPCRouter({
  waitlist: waitlistRouter,
  organization: organizationRouter,
  todo: todoRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
