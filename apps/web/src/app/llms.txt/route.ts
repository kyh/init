import { renderLlmsTxt } from "@/lib/agent/llms-txt";
import { source } from "@/lib/source";

/** Canonical documentation index. Request text/markdown for page content. */
export const GET = () => {
  const docs = source.getPages().map((page) => ({ title: page.data.title, url: page.url }));

  return new Response(renderLlmsTxt(docs), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
