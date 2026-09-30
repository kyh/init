import type { NextRequest } from "next/server";
import { appRouter, createORPCContext, REQUEST_ID_HEADER, resolveRequestId } from "@repo/api";
import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

import { isCrossOrigin, jsonError } from "@/orpc/request";

// Browser clients are same-origin. Leave CORS disabled; RPC also refuses GET by default.
const handler = new RPCHandler(appRouter, {
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

  // Minted here rather than read back off the context, so the response carries
  // an id even when context creation itself fails — a failed session lookup is
  // precisely when the caller needs something to quote.
  const requestId = resolveRequestId(req.headers);

  const { response } = await handler.handle(req, {
    context: await createORPCContext({ headers: req.headers, requestId }),
    prefix: "/api/orpc",
  });

  const result = response ?? jsonError(404, "NOT_FOUND", "No procedure matches this path.");
  // Hands the caller the id its log line was tagged with, so a failed response
  // traces to the server-side record of the call without matching timestamps.
  result.headers.set(REQUEST_ID_HEADER, requestId);
  return result;
};

export { handleRequest as GET, handleRequest as POST };
