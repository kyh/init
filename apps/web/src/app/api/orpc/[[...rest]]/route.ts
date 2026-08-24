import type { NextRequest } from "next/server";
import { appRouter, createORPCContext } from "@repo/api";
import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { SimpleCsrfProtectionHandlerPlugin } from "@orpc/server/plugins";

// No CORS headers: every client reaches this route same-origin. The web app is
// served from it, the extension popup iframes the web app, the desktop shell
// loads it, and React Native does not enforce CORS.
//
// SimpleCsrfProtection requires an `x-csrf-token` header, which the paired link
// plugin sends and an HTML form cannot set — and a cross-origin fetch that tries
// to set it needs a preflight this route never answers. That is load-bearing:
// auth cookies are SameSite=None (see packages/api/src/auth/auth.ts), so without
// it a cross-origin multipart form POST rides the session and invokes mutations.
// Adding permissive CORS headers here would let the preflight succeed and undo it.

// Errors that are normal control flow, not server faults: unauthenticated,
// forbidden, missing row, and rejected input. Logging them would just add noise.
const EXPECTED_ERROR_CODES = new Set(["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "BAD_REQUEST"]);

const handler = new RPCHandler(appRouter, {
  plugins: [new SimpleCsrfProtectionHandlerPlugin()],
  interceptors: [
    onError((error) => {
      if (error instanceof ORPCError && EXPECTED_ERROR_CODES.has(error.code)) return;
      console.error(">>> oRPC Error", error);
    }),
  ],
});

const handleRequest = async (req: NextRequest) => {
  const { response } = await handler.handle(req, {
    prefix: "/api/orpc",
    context: await createORPCContext({ headers: req.headers }),
  });

  return response ?? new Response("Not found", { status: 404 });
};

export { handleRequest as GET, handleRequest as POST };
