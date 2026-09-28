/** SameSite permits sibling origins, so browser requests also need an exact Origin check.
 * Allow absent Origin for native clients that send credentials explicitly. */
export const isCrossOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  return origin !== null && origin !== new URL(request.url).origin;
};

/** Mirrors the body oRPC sends for its own errors, so clients parse one format. */
export const jsonError = (status: number, code: string, message: string) =>
  Response.json({ code, defined: false, message }, { status });
