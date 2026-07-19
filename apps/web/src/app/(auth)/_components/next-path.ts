// Resolve the post-auth redirect target from a `nextPath` query param. Only
// same-origin relative paths are allowed — nextPath is attacker-controllable, so
// this guards against open redirects. Read server-side (in the page) and passed
// to the form as a prop, so the client form needs no useSearchParams/Suspense.
export const safeNextPath = (nextPath?: string): string =>
  nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
