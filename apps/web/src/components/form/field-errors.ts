/**
 * TanStack validators return either a raw string or a `{ message }` object
 * (Zod). FieldError reads `.message`, so normalize both shapes to it. Kept as a
 * type guard rather than a cast so a malformed error never slips through typed.
 */
export const toFieldErrors = (errors: readonly unknown[]): Array<{ message?: string }> =>
  errors.map((error) => {
    if (typeof error === "string") {
      return { message: error };
    }
    if (
      error !== null &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return { message: error.message };
    }
    return {};
  });
