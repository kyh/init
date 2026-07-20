import { z } from "zod";

// Org scoping — the `slug` input plus the membership check — comes from
// `organizationProcedure` (trpc.ts), which merges its own input with these. So
// these schemas carry only the todo's own fields.
const titleField = z.string().trim().min(1, "Title is required").max(255, "Title is too long");
const idField = z.uuid();
const completedField = z.boolean();

export const createTodoInput = z.object({
  title: titleField,
});

export const updateTodoInput = z
  .object({
    id: idField,
    title: titleField.optional(),
    completed: completedField.optional(),
  })
  .refine((data) => data.title !== undefined || data.completed !== undefined, {
    message: "Nothing to update",
    path: ["title"],
  });

export const deleteTodoInput = z.object({
  id: idField,
});
