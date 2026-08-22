/**
 * Feature flags — the unit of atomic, reversible change.
 *
 * A change that ships behind a flag can be turned off by editing one
 * environment variable and redeploying, instead of reverting a commit. That
 * matters most for agent-driven work: an agent can land a change dark, verify
 * it against a preview deployment with the flag on, and leave production
 * untouched until a human flips it.
 *
 * Flags are deploy-time configuration, not per-request state — they resolve
 * once at module load, the same way `env.ts` parses its schema once. Per-preview
 * variation comes from setting `FEATURE_FLAGS` differently on each Vercel
 * environment, not from varying it per request.
 */

/**
 * The flag registry. Declaring a key here is the only way to create a flag:
 * `FlagName` is derived from this object, so a typo at a read site is a type
 * error rather than a flag that silently reads `false` forever.
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

type ParsedFlags = {
  overrides: Partial<Flags>;
  /** Names present in the input that aren't in the registry — surfaced so a
   * typo in `FEATURE_FLAGS` is reported rather than silently doing nothing. */
  unknown: string[];
  /** Entries that aren't `name` or `name=value` at all. Reported for the same
   * reason, and never applied — see the refusal in the loop below. */
  malformed: string[];
};

/**
 * Parses the `FEATURE_FLAGS` format: a comma-separated list where each entry is
 * either `name` (enable) or `name=true` / `name=false` (explicit). Whitespace
 * around entries is ignored, so a value can be wrapped across lines in a `.env`.
 *
 *   FEATURE_FLAGS="exampleNewFeature"              → on
 *   FEATURE_FLAGS="exampleNewFeature=false"        → off, explicitly
 *   FEATURE_FLAGS="a, b=false"                     → a on, b off
 */
export const parseFlags = (raw: string | undefined): ParsedFlags => {
  const overrides: Partial<Flags> = {};
  const unknown: string[] = [];
  const malformed: string[] = [];

  for (const entry of raw?.split(",") ?? []) {
    const parts = entry.split("=");
    const name = parts[0]?.trim();
    if (!name) continue;
    if (!isFlagName(name)) {
      unknown.push(name);
      continue;
    }
    // More than one `=` isn't this format. Refuse rather than guess at which
    // half was meant: `myFlag=true=false` would otherwise read the first half
    // and turn the flag *on*, which is the one outcome garbled config must
    // never produce.
    if (parts.length > 2) {
      malformed.push(entry.trim());
      continue;
    }
    // A bare name means "on"; anything else must say `true` to enable, so a
    // stray value can never accidentally turn a flag on.
    overrides[name] = parts.length === 1 ? true : parts[1]?.trim() === "true";
  }

  return { overrides, unknown, malformed };
};

/** Registry defaults with the given `FEATURE_FLAGS` string applied over them. */
export const resolveFlags = (raw: string | undefined): Flags => ({
  ...flagDefaults,
  ...parseFlags(raw).overrides,
});

const parsed = parseFlags(process.env.FEATURE_FLAGS);

if (process.env.NODE_ENV !== "test") {
  if (parsed.unknown.length > 0) {
    console.warn(
      `[flags] ignoring unknown flag(s) in FEATURE_FLAGS: ${parsed.unknown.join(", ")}. ` +
        `Known flags: ${Object.keys(flagDefaults).join(", ") || "(none)"}`,
    );
  }
  if (parsed.malformed.length > 0) {
    console.warn(
      `[flags] ignoring malformed entr(ies) in FEATURE_FLAGS: ${parsed.malformed.join(", ")}. ` +
        `Expected \`name\` or \`name=true\`/\`name=false\`.`,
    );
  }
}

/**
 * The resolved flag set for this process. Read it via `ctx.flags` in a
 * procedure, or `flag.list` from a client.
 *
 * Frozen, and typed readonly: one object serves every request for the lifetime
 * of the process, so a handler that assigned to it would silently change what
 * every later request sees. Deploy-time config should only be changed by
 * redeploying.
 *
 * Built through `resolveFlags` rather than repeating the merge, so there is one
 * definition of how defaults and overrides combine.
 */
export const flags: Readonly<Flags> = Object.freeze(resolveFlags(process.env.FEATURE_FLAGS));
