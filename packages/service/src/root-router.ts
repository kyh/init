import { os } from "./orpc";
import { organizationRouter } from "./organization/organization-router";
import { todoRouter } from "./todo/todo-router";
import { waitlistRouter } from "./waitlist/waitlist-router";

/** `os.router` fails to compile if any contract procedure is missing or mistyped. */
export const appRouter = os.router({
  organization: organizationRouter,
  todo: todoRouter,
  waitlist: waitlistRouter,
});

export type AppRouter = typeof appRouter;
