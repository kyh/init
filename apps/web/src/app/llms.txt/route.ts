import { siteConfig } from "@/lib/site-config";
import { source } from "@/lib/source";

/** Canonical documentation index. Request text/markdown for page content. */
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
