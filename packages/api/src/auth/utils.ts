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

/**
 * Parses a JSON string, then validates the result is JSON-shaped. Pipe it into
 * a concrete schema to get a typed value:
 *
 * ```ts
 * const authMetadataSchema = zJsonString.pipe(z.object({ personal: z.boolean() }));
 * authMetadataSchema.parse('{"personal": true}'); // { personal: true }
 * ```
 */
export const zJsonString = z
  .string()
  .transform((str, ctx): unknown => {
    try {
      return JSON.parse(str);
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid JSON" });
      return z.NEVER;
    }
  })
  .pipe(z.json());
