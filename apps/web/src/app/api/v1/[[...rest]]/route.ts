import type { NextRequest } from "next/server";
import { appRouter } from "@repo/api";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { onError, ORPCError } from "@orpc/server";

import { OPENAPI_PREFIX } from "@/orpc/openapi";
import { handleORPCRequest } from "@/orpc/request";

/** REST view of the same router the RPC client uses, described by /openapi.json. */
const handler = new OpenAPIHandler(appRouter, {
  clientInterceptors: [
    // oxlint-disable-next-line promise/prefer-await-to-callbacks -- oRPC's interceptor hook takes the error as its argument
    onError((error, { context }) => {
      // Only unexpected failures need server logging.
      if (error instanceof ORPCError) {
        return;
      }
      console.error(">>> oRPC Error", context.requestId, error);
    }),
  ],
});

const handleRequest = (req: NextRequest) =>
  handleORPCRequest(
    req,
    (context) => handler.handle(req, { context, prefix: OPENAPI_PREFIX }),
    "No procedure matches this path. See /openapi.json.",
  );

export {
  handleRequest as DELETE,
  handleRequest as GET,
  handleRequest as PATCH,
  handleRequest as POST,
  handleRequest as PUT,
};
