import {
  renderHomeMarkdown,
  renderNotFoundMarkdown,
  renderSitePageMarkdown,
} from "@/lib/agent/markdown";
import { findSitePage } from "@/lib/agent/site-pages";
import { getLLMText, source } from "@/lib/source";

// Rough token estimate (~4 chars/token) for the optional x-markdown-tokens hint.
const estimateTokens = (text: string) => Math.ceil(text.length / 4);

const markdownResponse = (text: string, status = 200) =>
  new Response(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // The HTML and Markdown variants share a URL; caches must key on Accept.
      Vary: "Accept",
      // Markdown mirror of the HTML pages — keep it out of search indexes so
      // it doesn't compete with the canonical HTML as duplicate content.
      "X-Robots-Tag": "noindex",
      "x-markdown-tokens": String(estimateTokens(text)),
    },
    status,
  });

const renderPage = async (slug: string[]) => {
  if (slug.length === 0) {
    return renderHomeMarkdown();
  }

  if (slug[0] === "docs") {
    const page = source.getPage(slug.slice(1));
    return page ? await getLLMText(page) : undefined;
  }

  const sitePage = findSitePage(`/${slug.join("/")}`);
  return sitePage ? renderSitePageMarkdown(sitePage) : undefined;
};

/**
 * Serves markdown representations of HTML pages. Reached via a proxy rewrite
 * (src/proxy.ts) when the request prefers `text/markdown`. Unknown paths get a
 * Markdown 404 pointing at the discovery surfaces.
 */
export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) => {
  const { slug = [] } = await params;
  const markdown = await renderPage(slug);

  return markdown === undefined
    ? markdownResponse(renderNotFoundMarkdown(`/${slug.join("/")}`), 404)
    : markdownResponse(markdown);
};
