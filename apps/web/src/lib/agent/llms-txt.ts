import { siteConfig } from "@/lib/site-config";

import { absoluteUrl, agentLinks, whenToUse } from "./markdown";
import { sitePages } from "./site-pages";

/**
 * `/llms.txt` in the llmstxt.org shape: H1, blockquote summary, free prose, then
 * H2 sections that hold only link lists. The when-to-use guidance sits in the
 * prose block because the spec reserves H2 sections for links.
 */
export const renderLlmsTxt = (docs: { title: string; url: string }[]) =>
  [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    ...whenToUse.flatMap((paragraph) => [paragraph, ""]),
    "Every page listed here also answers `Accept: text/markdown` with a Markdown version.",
    "",
    "## Docs",
    "",
    ...docs.map((doc) => `- [${doc.title}](${absoluteUrl(doc.url)})`),
    "",
    "## Agent resources",
    "",
    ...agentLinks.map((link) => `- [${link.title}](${link.url}): ${link.description}`),
    "",
    "## Optional",
    "",
    `- [Source code](${siteConfig.repository}): GitHub repository, MIT licensed`,
    ...sitePages.map((page) => `- [${page.title}](${absoluteUrl(page.path)}): ${page.description}`),
    "",
  ].join("\n");
