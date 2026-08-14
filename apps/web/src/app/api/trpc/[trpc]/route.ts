import type { NextRequest } from "next/server";
import { appRouter, createTRPCContext, REQUEST_ID_HEADER, resolveRequestId } from "@repo/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

// No CORS headers: every client reaches this route same-origin. The web app is
// served from it, the extension popup iframes the web app, the desktop shell
// loads it, and React Native does not enforce CORS. Opening it up would only
// widen the cross-site surface, which matters here because auth cookies are
// SameSite=None (see packages/api/src/auth/auth.ts).

// Errors that are normal control flow, not server faults: unauthenticated,
// forbidden, missing row, and rejected input. Logging them would just add noise.
const EXPECTED_ERROR_CODES = new Set(["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "BAD_REQUEST"]);

const handler = async (req: NextRequest) => {
  // Minted here rather than read back off the context, so the response and the
  // error log still carry an id when context creation itself fails — a failed
  // session lookup is precisely when the caller needs something to quote.
  const requestId = resolveRequestId(req.headers);

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () => createTRPCContext({ headers: req.headers, requestId }),
    // Hands the caller the id its log lines were tagged with, so a failed
    // response traces back to the server-side record of the call without
    // correlating by timestamp.
    responseMeta: () => ({ headers: { [REQUEST_ID_HEADER]: requestId } }),
    onError: ({ error, path }) => {
      if (!EXPECTED_ERROR_CODES.has(error.code)) {
        console.error(`>>> tRPC Error on '${path}' [${requestId}]`, error);
      }
    },
  });
};

export { handler as GET, handler as POST };
