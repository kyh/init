import type { NextRequest } from "next/server";
import { appRouter, createORPCContext } from "@repo/api";
import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

// No CORS headers, and none belong here: every browser client reaches this
// route same-origin (the web app is served from it, the desktop shell
// top-level-navigates to it, the extension popup opens it in a tab), and React
// Native doesn't enforce CORS. Credentialed CORS headers would hand a
// cross-origin page authenticated access. GET, the one method a cookie-bearing
// navigation can reach, is refused by the handler's default `allowMethods`.
const handler = new RPCHandler(appRouter, {
  clientInterceptors: [
    onError((error) => {
      // An ORPCError is a procedure answering deliberately — rejected input, a
      // missing row, a caller without access. Everything else is a real fault.
      if (error instanceof ORPCError) return;
      console.error(">>> oRPC Error", error);
    }),
  ],
});

/**
 * The session cookie's SameSite=Lax is only half the answer, because SameSite
 * keys on *site*, not origin: a sibling subdomain or another port on the same
 * host is same-site, so the browser does attach the session cookie to a plain
 * `<form method=POST>` served from there and the mutation runs authenticated.
 * Deployments of this template share a registrable domain with their siblings,
 * so any one of them — or an XSS on one — would otherwise be an authenticated
 * client of this endpoint. Browsers set `Origin` on every POST and page script
 * cannot forge it, so an `Origin` that isn't ours is the signal.
 *
 * Absent `Origin` passes: that is React Native, which has no cookie jar and
 * sends the session as an explicit header (see apps/mobile/src/utils/api.ts),
 * so it carries no ambient credential another page could ride.
 *
 * Checked at the route boundary rather than in a handler plugin so it runs once
 * on the real request, not on client-authored sub-requests should batching ever
 * be enabled.
 */
const isCrossOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  return origin !== null && origin !== new URL(request.url).origin;
};

const handleRequest = async (req: NextRequest) => {
  if (isCrossOrigin(req)) {
    return new Response("Cross-origin request blocked.", { status: 403 });
  }

  const { response } = await handler.handle(req, {
    prefix: "/api/orpc",
    context: await createORPCContext({ headers: req.headers }),
  });

  return response ?? new Response("Not found", { status: 404 });
};

export { handleRequest as GET, handleRequest as POST };
