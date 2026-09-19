/**
 * Feature flags — the unit of atomic, reversible change.
 *
 * A change that ships behind a flag is turned off by editing one environment
 * variable and redeploying, instead of reverting a commit. That matters most for
 * agent-driven work: a change can land dark, be verified against a preview
 * deployment with the flag on, and leave production untouched until a human
 * flips it.
 *
 * Flags are deploy-time configuration, not per-request state — they resolve once
 * at module load, the same way `env.ts` parses its schema once. Per-preview
 * variation comes from setting `FEATURE_FLAGS` differently on each environment,
 * not from varying it per request.
 */

/**
 * The flag registry. Declaring a key here is the only way to create a flag:
 * `FlagName` derives from this object, so a typo at a read site is a type error
 * rather than a flag that silently reads `false` forever.
 *
 * `exampleNewFeature` is the template's placeholder — delete it when you add
 * your first real flag.
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
    // More than one `=` isn't this format. Refuse rather than guess which half
    // was meant: `myFlag=true=false` would otherwise read the first half and
    // turn the flag *on*, the one outcome garbled config must never produce.
    if (parts.length > 2) {
      malformed.push(entry.trim());
      continue;
    }
    // A bare name means "on"; anything else must say `true`, so a stray value
    // can never accidentally enable a flag.
    overrides[name] = parts.length === 1 ? true : parts[1]?.trim() === "true";
  }

  return { malformed, overrides, unknown };
};

/** Registry defaults with the given `FEATURE_FLAGS` string applied over them. */
export const resolveFlags = (raw?: string): Flags => ({
  ...flagDefaults,
  ...parseFlags(raw).overrides,
});

const parsed = parseFlags(process.env.FEATURE_FLAGS);

// Warn once at load, but never while a test runner is driving the process —
// `node --test` sets NODE_TEST_CONTEXT and leaves NODE_ENV undefined.
if (process.env.NODE_ENV !== "test" && process.env.NODE_TEST_CONTEXT === undefined) {
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
}

/**
 * The resolved flag set for this process. Read it as `context.flags` in a
 * procedure, or through the `flag.list` call from any client.
 *
 * Frozen and typed readonly: one object serves every request for the lifetime of
 * the process, so a handler that assigned to it would silently change what every
 * later request sees. Deploy-time config should only change by redeploying.
 */
export const flags: Readonly<Flags> = Object.freeze(resolveFlags(process.env.FEATURE_FLAGS));
