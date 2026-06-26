import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Markdown for Agents: when a client asks for markdown via the Accept header,
 * rewrite to the /md handler which returns a markdown representation. Browsers
 * never send `text/markdown`, so they keep getting HTML — markdown is purely an
 * agent-facing content negotiation.
 */
export const proxy = (request: NextRequest) => {
  const accept = request.headers.get("accept") ?? "";

  if (request.method === "GET" && accept.includes("text/markdown")) {
    const url = request.nextUrl.clone();
    url.pathname = url.pathname === "/" ? "/md" : `/md${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/", "/docs/:path*"],
};
