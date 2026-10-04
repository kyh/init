import { todo } from "@repo/db/drizzle-schema";
import { openapi } from "@orpc/openapi";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { organizationBase } from "../base";
import { organizationInput } from "../organization/organization-schema";
import { createTodoInput, deleteTodoInput, updateTodoInput } from "./todo-schema";

const todoRow = createSelectSchema(todo);
const todoOutput = z.object({ todo: todoRow });

export const todoContract = {
  create: organizationBase
    .meta(
      openapi({
        description:
          "Creates an incomplete todo in the organization named by `slug`. The title is trimmed and must be 1-255 characters.",
        summary: "Create a todo",
        tags: ["Todo"],
      }),
    )
    .input(createTodoInput)
    .output(todoOutput),
  delete: organizationBase
    .meta(
      openapi({
        description:
          "Permanently deletes a todo by `id` and returns the deleted row. Answers NOT_FOUND if no todo with that id belongs to the organization.",
        summary: "Delete a todo",
        tags: ["Todo"],
      }),
    )
    .input(deleteTodoInput)
    .output(todoOutput),
  list: organizationBase
    .meta(
      openapi({
        description: "Lists every todo in the organization named by `slug`, newest first.",
        summary: "List todos",
        tags: ["Todo"],
      }),
    )
    .input(organizationInput)
    .output(z.object({ todos: z.array(todoRow) })),
  update: organizationBase
    .meta(
      openapi({
        description:
          "Changes a todo's `title`, `completed`, or both; fields left out keep their value, and at least one is required. Answers NOT_FOUND if no todo with that id belongs to the organization.",
        summary: "Update a todo",
        tags: ["Todo"],
      }),
    )
    .input(updateTodoInput)
    .output(todoOutput),
};
