import { organizationRouter } from "./organization/organization-router";
import { todoRouter } from "./todo/todo-router";
import { waitlistRouter } from "./waitlist/waitlist-router";

export const appRouter = {
  organization: organizationRouter,
  todo: todoRouter,
  waitlist: waitlistRouter,
};

export type AppRouter = typeof appRouter;
