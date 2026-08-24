import { trustedOrigins } from "./auth/auth";

const TRUSTED_ORIGINS = new Set(trustedOrigins);

/**
 * True when a request carries browser provenance that isn't same-origin or an
 * allow-listed origin. Auth cookies are SameSite=None (an extension-iframe
 * constraint, see auth.ts), so the browser's own CSRF backstop is off for the
 * RPC endpoint and better-auth's Origin checks only cover /api/auth/*.
 * Non-browser callers send neither header and are left alone; session auth
 * still applies.
 *
 * Lives at the HTTP boundary rather than in a procedure middleware because
 * oRPC has no query/mutation distinction to branch on — every RPC call is
 * checked.
 */
export const isUntrustedOrigin = (origin: string | null, secFetchSite: string | null) => {
  // Sec-Fetch-Site is set by the browser and cannot be forged from script.
  if (secFetchSite === "same-origin" || secFetchSite === "none") return false;
  // No browser provenance at all — not a browser CSRF vector.
  if (!origin && !secFetchSite) return false;
  // A cross-site/same-site label, or any Origin, must match the allow-list.
  // Fail closed: a stripped Origin under a cross-site label is rejected.
  return origin === null || !TRUSTED_ORIGINS.has(origin);
};
