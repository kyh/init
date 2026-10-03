/** NFKD preserves ASCII base letters. Names without one yield an empty slug; callers supply a fallback. */
export const slugify = (str: string) =>
  str
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036F]/gu, "")
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9 -]/gu, "")
    .replaceAll(/\s+/gu, "-")
    .replaceAll(/-+/gu, "-")
    .replaceAll(/^-|-$/gu, "");

export const FALLBACK_ORGANIZATION_SLUG = "workspace";
