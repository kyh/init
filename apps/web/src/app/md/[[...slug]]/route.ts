import {
  renderHomeMarkdown,
  renderNotFoundMarkdown,
  renderSitePageMarkdown,
} from "@/lib/agent/markdown";
import { findSitePage } from "@/lib/agent/site-pages";
import { getLLMText, source } from "@/lib/source";

const estimateTokens = (text: string) => Math.ceil(text.length / 4);

const markdownResponse = (text: string, status = 200) =>
  new Response(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
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
