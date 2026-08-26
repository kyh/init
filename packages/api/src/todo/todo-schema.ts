import { z } from "zod";

import { organizationInput } from "../organization/organization-schema";

const titleField = z.string().trim().min(1, "Title is required").max(255, "Title is too long");
const idField = z.uuid();
const completedField = z.boolean();

export const createTodoInput = organizationInput.extend({
  title: titleField,
});

export const updateTodoInput = organizationInput
  .extend({
    id: idField,
    title: titleField.optional(),
    completed: completedField.optional(),
  })
  .refine((data) => data.title !== undefined || data.completed !== undefined, {
    message: "Nothing to update",
    path: ["title"],
  });

export const deleteTodoInput = organizationInput.extend({
  id: idField,
});
