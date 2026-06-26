import { siteConfig } from "@/lib/site-config";
import { source } from "@/lib/source";

/**
 * llms.txt — a flat, agent-friendly index of the documentation. Each entry is a
 * canonical URL; append `Accept: text/markdown` (or see /md) to fetch the
 * markdown body of any page. See https://llmstxt.org.
 */
export const GET = () => {
  const links = source
    .getPages()
    .map((page) => {
      const title = page.data.title;
      return `- [${title}](${siteConfig.url}${page.url})`;
    })
    .join("\n");

  const body = `# ${siteConfig.name}\n\n> ${siteConfig.description}\n\n## Docs\n\n${links}\n`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
