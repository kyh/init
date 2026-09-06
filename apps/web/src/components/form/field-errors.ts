import { z } from "zod";

/** Normalize string and Zod validator errors for FieldError. */
const fieldError = z.union([
  z.string().transform((message) => ({ message })),
  z.object({ message: z.string() }),
]);

export const toFieldErrors = (errors: readonly unknown[]): Array<{ message?: string }> =>
  errors.map((error) => {
    const parsed = fieldError.safeParse(error);
    return parsed.success ? parsed.data : {};
  });
