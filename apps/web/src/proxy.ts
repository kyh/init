import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { prefersMarkdown } from "@/lib/agent/accept";

/**
 * Markdown for Agents: a request that prefers `text/markdown` is rewritten to
 * the /md handler, which answers with Markdown (a Markdown 404 for unknown
 * paths). Browsers never prefer markdown, so they keep getting HTML.
 */
export const proxy = (request: NextRequest) => {
  if (request.method !== "GET" || !prefersMarkdown(request.headers.get("accept"))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = url.pathname === "/" ? "/md" : `/md${url.pathname}`;
  return NextResponse.rewrite(url);
};

/**
 * Only requests whose Accept mentions markdown reach the proxy, so HTML views
 * pay nothing. Next and Vercel compile `has` values to anchored, case-sensitive
 * regexes, hence the per-character case classes. The app, auth and API routes
 * and single-representation files are excluded.
 */
export const config = {
  matcher: [
    {
      has: [{ key: "accept", type: "header", value: ".*[Mm][Aa][Rr][Kk][Dd][Oo][Ww][Nn].*" }],
      source:
        "/((?!api/|_next/|_vercel/|md/|auth/|dashboard|favicon/|assets/|\\.well-known/|llms\\.txt$|robots\\.txt$|sitemap\\.xml$|openapi\\.json$|og\\.jpg$|logo).*)",
    },
  ],
};
