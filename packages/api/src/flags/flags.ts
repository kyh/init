/**
 * Feature flags: a risky change lands dark and is turned off by editing
 * `FEATURE_FLAGS` and redeploying, not by reverting. Resolved once at load; vary
 * it per Vercel environment, not per request.
 *
 * Declaring a key in `flagDefaults` is the only way to create a flag, so a typo
 * at a read site is a type error. `exampleNewFeature` is a placeholder — replace
 * it with your first real flag.
 */
export const flagDefaults = {
  exampleNewFeature: false,
} as const satisfies Record<string, boolean>;

export type FlagName = keyof typeof flagDefaults;
export type Flags = Record<FlagName, boolean>;

const FLAG_NAMES: ReadonlySet<string> = new Set(Object.keys(flagDefaults));

const isFlagName = (name: string): name is FlagName => FLAG_NAMES.has(name);

interface ParsedFlags {
  /** Entries that are neither `name` nor `name=value`. Reported, never applied. */
  malformed: string[];
  overrides: Partial<Flags>;
  /** Names absent from the registry, so a typo is reported rather than ignored. */
  unknown: string[];
}

/**
 * Parses the `FEATURE_FLAGS` format: a comma-separated list where each entry is
 * either `name` (enable) or `name=true` / `name=false` (explicit). Whitespace
 * around entries is ignored, so the value can wrap across lines in a `.env`.
 *
 *   FEATURE_FLAGS="exampleNewFeature"         → on
 *   FEATURE_FLAGS="exampleNewFeature=false"   → off, explicitly
 *   FEATURE_FLAGS="a, b=false"                → a on, b off
 */
export const parseFlags = (raw?: string): ParsedFlags => {
  const malformed: string[] = [];
  const overrides: Partial<Flags> = {};
  const unknown: string[] = [];

  for (const entry of raw?.split(",") ?? []) {
    const parts = entry.split("=");
    const name = parts[0]?.trim();
    if (!name) {
      continue;
    }
    if (!isFlagName(name)) {
      unknown.push(name);
      continue;
    }
    // Refuse `a=true=false` rather than guess: garbled config must never enable a flag.
    if (parts.length > 2) {
      malformed.push(entry.trim());
      continue;
    }
    // A bare name means "on"; otherwise only a literal `true` enables.
    overrides[name] = parts.length === 1 ? true : parts[1]?.trim() === "true";
  }

  return { malformed, overrides, unknown };
};

const parsed = parseFlags(process.env.FEATURE_FLAGS);

if (parsed.unknown.length > 0) {
  console.warn(
    `[flags] ignoring unknown flag(s) in FEATURE_FLAGS: ${parsed.unknown.join(", ")}. ` +
      `Known flags: ${Object.keys(flagDefaults).join(", ") || "(none)"}`,
  );
}
if (parsed.malformed.length > 0) {
  console.warn(
    `[flags] ignoring malformed entr(ies) in FEATURE_FLAGS: ${parsed.malformed.join(", ")}. ` +
      "Expected `name` or `name=true`/`name=false`.",
  );
}

/** Read as `context.flags` in a procedure, or via `flag.list` from any client.
 * Frozen because one object serves every request for the process's lifetime. */
export const flags: Readonly<Flags> = Object.freeze({ ...flagDefaults, ...parsed.overrides });
