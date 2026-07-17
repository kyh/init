import { siteConfig } from "@/lib/site-config";
import { getLLMText, source } from "@/lib/source";

// Rough token estimate (~4 chars/token) for the optional x-markdown-tokens hint.
const estimateTokens = (text: string) => Math.ceil(text.length / 4);

const markdownResponse = (text: string) =>
  new Response(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "x-markdown-tokens": String(estimateTokens(text)),
      // Markdown mirror of the HTML pages — keep it out of search indexes so
      // it doesn't compete with the canonical HTML as duplicate content.
      "X-Robots-Tag": "noindex",
    },
  });

const homepageMarkdown = () =>
  `# ${siteConfig.name}\n\n${siteConfig.description}\n\n- Docs: ${siteConfig.url}/docs\n- Doc index (markdown): ${siteConfig.url}/llms.txt\n- API catalog: ${siteConfig.url}/.well-known/api-catalog\n`;

/**
 * Serves markdown representations of HTML pages. Reached via a proxy rewrite
 * (src/proxy.ts) when the request carries `Accept: text/markdown`.
 */
export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) => {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return markdownResponse(homepageMarkdown());
  }

  if (slug[0] === "docs") {
    const page = source.getPage(slug.slice(1));
    if (!page) {
      return new Response("Not found", { status: 404 });
    }
    return markdownResponse(await getLLMText(page));
  }

  return new Response("Not found", { status: 404 });
};
