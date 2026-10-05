import { APIError } from "better-auth/api";
import { z } from "zod";

const pgUniqueViolation = z.object({ code: z.literal("23505") });

/** Retry slug collisions from better-auth or Postgres; propagate other failures. */
export const isSlugCollision = (cause: unknown): boolean => {
  if (cause instanceof APIError) {
    return /slug|already (?:exists|taken)/iu.test(cause.message);
  }
  return pgUniqueViolation.safeParse(cause).success;
};
