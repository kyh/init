import type { ORPCContext } from "@repo/api";
import { createORPCContext, REQUEST_ID_HEADER, resolveRequestId } from "@repo/api";

/** SameSite permits sibling origins, so browser requests also need an exact Origin check.
 * Allow absent Origin for native clients that send credentials explicitly. */
export const isCrossOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  return origin !== null && origin !== new URL(request.url).origin;
};

/** Mirrors the body oRPC sends for its own errors, so clients parse one format. */
export const jsonError = (status: number, code: string, message: string) =>
  Response.json({ code, defined: false, message }, { status });

const respond = async (
  request: Request,
  requestId: string,
  handle: (context: ORPCContext) => Promise<{ response?: Response }>,
  notFoundMessage: string,
) => {
  if (isCrossOrigin(request)) {
    return jsonError(403, "FORBIDDEN", "Cross-origin request blocked.");
  }
  try {
    const { response } = await handle(
      await createORPCContext({ headers: request.headers, requestId }),
    );
    return response ?? jsonError(404, "NOT_FOUND", notFoundMessage);
  } catch (error) {
    // The handler turns procedure failures into responses, so this is context
    // creation (the session lookup) failing.
    console.error(">>> oRPC Error", requestId, error);
    return jsonError(500, "INTERNAL_SERVER_ERROR", "Internal server error.");
  }
};

/** Shared by every oRPC route: the response's `x-request-id` is the id the call's
 * log line carries, on every outcome including 403, 404 and 500. */
export const handleORPCRequest = async (
  request: Request,
  handle: (context: ORPCContext) => Promise<{ response?: Response }>,
  notFoundMessage: string,
) => {
  const requestId = resolveRequestId(request.headers);
  const response = await respond(request, requestId, handle, notFoundMessage);
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
};
