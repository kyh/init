import type { NextRequest } from "next/server";
import { appRouter } from "@repo/api";
import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

import { handleORPCRequest } from "@/orpc/request";

// Browser clients are same-origin. Leave CORS disabled; RPC also refuses GET by default.
const handler = new RPCHandler(appRouter, {
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
    (context) => handler.handle(req, { context, prefix: "/api/orpc" }),
    "No procedure matches this path.",
  );

export { handleRequest as GET, handleRequest as POST };
