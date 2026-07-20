import type { NextRequest } from "next/server";
import { appRouter, createTRPCContext } from "@repo/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

// No CORS headers: every client reaches this route same-origin. The web app is
// served from it, the extension popup iframes the web app, the desktop shell
// loads it, and React Native does not enforce CORS. Opening it up would only
// widen the cross-site surface, which matters here because auth cookies are
// SameSite=None (see packages/api/src/auth/auth.ts).

// Errors that are normal control flow, not server faults: unauthenticated,
// forbidden, missing row, and rejected input. Logging them would just add noise.
const EXPECTED_ERROR_CODES = new Set(["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "BAD_REQUEST"]);

const handler = async (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () => createTRPCContext({ headers: req.headers }),
    onError: ({ error, path }) => {
      if (!EXPECTED_ERROR_CODES.has(error.code)) {
        console.error(`>>> tRPC Error on '${path}'`, error);
      }
    },
  });

export { handler as GET, handler as POST };
