/** OAuth must navigate inside the window. Keep these aligned with the configured auth providers. */
export const OAUTH_ORIGINS = ["https://github.com"];

export type Verdict = "allow" | "open-externally" | "deny";

const originOf = (url: string) => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

export const isWebUrl = (url: string) => {
  try {
    const { protocol } = new URL(url);

    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

/** The web app's origin, the OAuth providers', and in development the GitHub emulator's when set. */
export const allowedOrigins = (appUrl: string, emulator?: string) => {
  const allowed = [new URL(appUrl).origin, ...OAUTH_ORIGINS];
  const emulatorOrigin = emulator === undefined ? null : originOf(emulator);

  if (emulatorOrigin !== null && emulatorOrigin !== "null") {
    allowed.push(emulatorOrigin);
  }

  return allowed;
};

/** Compared by origin, never by prefix: `http://localhost:3000` prefixes `http://localhost:30001`. */
export const classify = (target: string, allowed: readonly string[]) => {
  const origin = originOf(target);

  if (origin !== null && origin !== "null" && allowed.includes(origin)) {
    return "allow" satisfies Verdict;
  }

  return isWebUrl(target) ? ("open-externally" satisfies Verdict) : ("deny" satisfies Verdict);
};
