import type { NextRequest } from "next/server";
import { appRouter, createORPCContext, isUntrustedOrigin } from "@repo/api";
import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

// No CORS headers: every client reaches this route same-origin. The web app is
// served from it, the extension popup iframes the web app, the desktop shell
// loads it, and React Native does not enforce CORS. Opening it up would only
// widen the cross-site surface, which matters here because auth cookies are
// SameSite=None (see packages/api/src/auth/auth.ts).

// Errors that are normal control flow, not server faults: unauthenticated,
// forbidden, missing row, and rejected input. Logging them would just add noise.
const EXPECTED_ERROR_CODES = new Set(["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "BAD_REQUEST"]);

const handler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      if (error instanceof ORPCError && EXPECTED_ERROR_CODES.has(error.code)) return;
      console.error(">>> oRPC Error", error);
    }),
  ],
});

const handleRequest = async (req: NextRequest) => {
  if (isUntrustedOrigin(req.headers.get("origin"), req.headers.get("sec-fetch-site"))) {
    return new Response("Cross-origin request rejected", { status: 403 });
  }

  const { response } = await handler.handle(req, {
    prefix: "/api/orpc",
    context: await createORPCContext({ headers: req.headers }),
  });

  return response ?? new Response("Not found", { status: 404 });
};

export { handleRequest as GET, handleRequest as POST };
