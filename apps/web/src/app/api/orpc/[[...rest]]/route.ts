import type { NextRequest } from "next/server";
import { appRouter, createORPCContext } from "@repo/core-service";
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

  const { response } = await handler.handle(req, {
    context: await createORPCContext({ headers: req.headers }),
    prefix: "/api/orpc",
  });

  return response ?? jsonError(404, "NOT_FOUND", "No procedure matches this path.");
};

export { handleRequest as GET, handleRequest as POST };
