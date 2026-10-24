import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import { prefersMarkdown } from "@/lib/agent/accept";

/**
 * Optimistic sign-in gate: a dashboard request with no session cookie gets a 307 to login
 * before any rendering, since a redirect from inside a streamed Suspense boundary can only
 * answer 200. It only checks that the cookie exists; each page still verifies the session.
 */
const redirectSignedOut = (request: NextRequest) => {
  if (getSessionCookie(request)) {
    return NextResponse.next();
  }
  const { pathname, search } = request.nextUrl;
  const login = new URL("/auth/login", request.url);
  login.searchParams.set("nextPath", `${pathname}${search}`);
  return NextResponse.redirect(login);
};

const isDashboard = (pathname: string) =>
  pathname === "/dashboard" || pathname.startsWith("/dashboard/");

/**
 * Markdown for Agents: a request that prefers `text/markdown` is rewritten to
 * the /md handler, which answers with Markdown (a Markdown 404 for unknown
 * paths). Browsers never prefer markdown, so they keep getting HTML.
 * Dashboard requests go through the sign-in gate instead.
 */
export const proxy = (request: NextRequest) => {
  if (isDashboard(request.nextUrl.pathname)) {
    return redirectSignedOut(request);
  }

  if (request.method !== "GET" || !prefersMarkdown(request.headers.get("accept"))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = url.pathname === "/" ? "/md" : `/md${url.pathname}`;
  return NextResponse.rewrite(url);
};

/**
 * Dashboard routes always reach the proxy, for the sign-in gate. Otherwise only
 * requests whose Accept mentions markdown reach it, so HTML views pay nothing.
 * Next and Vercel compile `has` values to anchored, case-sensitive regexes,
 * hence the per-character case classes. The app, auth and API routes and
 * single-representation files are excluded.
 */
export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    {
      has: [{ key: "accept", type: "header", value: ".*[Mm][Aa][Rr][Kk][Dd][Oo][Ww][Nn].*" }],
      source:
        "/((?!api/|_next/|_vercel/|md/|auth/|dashboard|favicon/|assets/|\\.well-known/|llms\\.txt$|robots\\.txt$|sitemap\\.xml$|openapi\\.json$|og\\.jpg$|og/|logo).*)",
    },
  ],
};
