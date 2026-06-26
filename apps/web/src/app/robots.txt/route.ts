import { siteConfig } from "@/lib/site-config";

/**
 * robots.txt as a route handler (instead of Next's MetadataRoute.Robots) so we
 * can emit Content-Signal directives — preferences for how AI systems may use
 * this content. See https://contentsignals.org.
 *
 * search    = appear in search results
 * ai-input  = use as grounding for AI answers (RAG / agent retrieval)
 * ai-train  = use to train generative models
 */
export const GET = () => {
  const body = [
    "User-Agent: *",
    "Allow: /",
    "Content-Signal: search=yes, ai-input=yes, ai-train=yes",
    "",
    `Sitemap: ${siteConfig.url}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
