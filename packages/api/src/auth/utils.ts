import { APIError } from "better-auth/api";
import { z } from "zod";

const pgUniqueViolation = z.object({ code: z.literal("23505") });

/** Retry slug collisions from better-auth or Postgres; propagate other failures. */
export const isSlugCollision = (cause: unknown): boolean => {
  if (cause instanceof APIError) {
    return /slug|already (exists|taken)/i.test(cause.message);
  }
  return pgUniqueViolation.safeParse(cause).success;
};

/** NFKD preserves ASCII base letters. Names without one yield an empty slug; callers supply a fallback. */
export const slugify = (str: string) =>
  str
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const FALLBACK_ORGANIZATION_SLUG = "workspace";
