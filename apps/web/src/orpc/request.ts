/** SameSite permits sibling origins, so browser requests also need an exact Origin check.
 * Allow absent Origin for native clients that send credentials explicitly. */
export const isCrossOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  return origin !== null && origin !== new URL(request.url).origin;
};

/** Vercel overwrites x-forwarded-for with the client's address; without such a proxy in front,
 * callers control this header, so self-hosting needs one that sets it. */
export const clientAddress = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

/** Mirrors the body oRPC sends for its own errors, so clients parse one format. */
export const jsonError = (status: number, code: string, message: string, headers?: HeadersInit) =>
  Response.json({ code, defined: false, message }, { headers, status });
