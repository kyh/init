import { z } from "zod";

/**
 * Converts a string to a URL-friendly slug.
 *
 * Decomposing to NFKD first separates a letter from its diacritics, so the
 * ASCII filter keeps the base letter ("café" -> "cafe") instead of dropping
 * the pair ("caf"). Scripts with no ASCII base — CJK, Cyrillic, Arabic —
 * still slugify to "", so callers that need a guaranteed-routable slug must
 * supply their own fallback.
 */
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

/** Base slug for organizations whose name slugifies to "" — see `slugify`. */
export const FALLBACK_ORGANIZATION_SLUG = "workspace";

export type Primitive = string | number | boolean | null;

export type JsonType = Primitive | { [key: PropertyKey]: JsonType } | JsonType[];

/**
 * Zod schema for parsing JSON strings
 *
 * Example usage:
 *
 * ```ts
 * const authMetadataSchema = zJsonString.pipe(z.object({
 *   personal: z.boolean(),
 * }));
 * ```
 *
 * ```ts
 * const authMetadata = authMetadataSchema.parse('{"personal": true}');
 * console.log(authMetadata); // { personal: true }
 * ```
 */
export const zJsonString = z.string().transform((str, ctx): JsonType => {
  try {
    return JSON.parse(str) as JsonType;
  } catch {
    ctx.addIssue({ code: "custom", message: "Invalid JSON" });
    return z.NEVER;
  }
});
