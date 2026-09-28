import type { NextRequest } from "next/server";
import { appRouter, createORPCContext } from "@repo/api";
import { consumeRateLimit, rateLimitHeaders } from "@repo/api/rate-limit/rate-limit";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { onError, ORPCError } from "@orpc/server";

import { OPENAPI_PREFIX } from "@/orpc/openapi";
import { clientAddress, isCrossOrigin, jsonError } from "@/orpc/request";

/** REST view of the same router the RPC client uses, described by /openapi.json. */
const handler = new OpenAPIHandler(appRouter, {
  clientInterceptors: [
    // oxlint-disable-next-line promise/prefer-await-to-callbacks -- oRPC's interceptor hook takes the error as its argument
    onError((error) => {
      // Only unexpected failures need server logging.
      if (error instanceof ORPCError) {
        return;
      }
      console.error(">>> oRPC Error", error);
    }),
  ],
});

const handleProcedure = async (req: NextRequest) => {
  const { response } = await handler.handle(req, {
    context: await createORPCContext({ headers: req.headers }),
    prefix: OPENAPI_PREFIX,
  });

  return (
    response ?? jsonError(404, "NOT_FOUND", "No procedure matches this path. See /openapi.json.")
  );
};

const handleRequest = async (req: NextRequest) => {
  if (isCrossOrigin(req)) {
    return jsonError(403, "FORBIDDEN", "Cross-origin request blocked.");
  }

  // Without a client address there is nothing to key a limit on (tests, direct local calls).
  const address = clientAddress(req);
  if (!address) {
    return handleProcedure(req);
  }

  const limit = await consumeRateLimit(`api-v1:${address}`);
  const headers = rateLimitHeaders(limit);
  if (!limit.allowed) {
    return jsonError(
      429,
      "TOO_MANY_REQUESTS",
      `Rate limit exceeded. Retry in ${limit.resetSeconds}s.`,
      headers,
    );
  }

  const response = await handleProcedure(req);
  for (const [name, value] of headers) {
    response.headers.set(name, value);
  }
  return response;
};

export {
  handleRequest as DELETE,
  handleRequest as GET,
  handleRequest as PATCH,
  handleRequest as POST,
  handleRequest as PUT,
};
