import { z } from "zod";

/**
 * TanStack validators return either a raw string or a `{ message }` object
 * (Zod). FieldError reads `.message`, so normalize both to it. Parsed with a
 * schema rather than cast so a malformed error never slips through typed.
 */
const fieldError = z.union([
  z.string().transform((message) => ({ message })),
  z.object({ message: z.string() }),
]);

export const toFieldErrors = (errors: readonly unknown[]): Array<{ message?: string }> =>
  errors.map((error) => {
    const parsed = fieldError.safeParse(error);
    return parsed.success ? parsed.data : {};
  });
