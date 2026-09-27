import type { NextRequest } from "next/server";
import { appRouter, createORPCContext } from "@repo/api";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { onError, ORPCError } from "@orpc/server";

import { OPENAPI_PREFIX } from "@/orpc/openapi";
import { isCrossOrigin, jsonError } from "@/orpc/request";

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

const handleRequest = async (req: NextRequest) => {
  if (isCrossOrigin(req)) {
    return jsonError(403, "FORBIDDEN", "Cross-origin request blocked.");
  }

  const { response } = await handler.handle(req, {
    context: await createORPCContext({ headers: req.headers }),
    prefix: OPENAPI_PREFIX,
  });

  return (
    response ?? jsonError(404, "NOT_FOUND", "No procedure matches this path. See /openapi.json.")
  );
};

export {
  handleRequest as DELETE,
  handleRequest as GET,
  handleRequest as PATCH,
  handleRequest as POST,
  handleRequest as PUT,
};
