import { organizationRouter } from "./organization/organization-router";
import { todoRouter } from "./todo/todo-router";
import { waitlistRouter } from "./waitlist/waitlist-router";

export const appRouter = {
  waitlist: waitlistRouter,
  organization: organizationRouter,
  todo: todoRouter,
};

export type AppRouter = typeof appRouter;
