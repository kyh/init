import { z } from "zod";

export const todoSlugInput = z.object({
  slug: z.string().min(1, "Organization slug is required"),
});

const titleField = z.string().trim().min(1, "Title is required").max(255, "Title is too long");
const idField = z.uuid();
const completedField = z.boolean();

export const createTodoInput = todoSlugInput.extend({
  title: titleField,
});

export const updateTodoInput = todoSlugInput
  .extend({
    id: idField,
    title: titleField.optional(),
    completed: completedField.optional(),
  })
  .refine((data) => data.title !== undefined || data.completed !== undefined, {
    message: "Nothing to update",
    path: ["title"],
  });

export const deleteTodoInput = todoSlugInput.extend({
  id: idField,
});

export type CreateTodoInput = z.infer<typeof createTodoInput>;
export type UpdateTodoInput = z.infer<typeof updateTodoInput>;
export type DeleteTodoInput = z.infer<typeof deleteTodoInput>;
