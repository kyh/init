import { siteConfig } from "@/lib/site-config";

import { sitePages } from "./site-pages";

import type { SitePage } from "./site-pages";

export const absoluteUrl = (path: string) => `${siteConfig.url}${path}`;

/** The machine-readable surfaces an agent can use to find its way around. */
export const agentLinks = [
  { description: "documentation", title: "Docs", url: absoluteUrl("/docs") },
  { description: "doc index for agents", title: "llms.txt", url: absoluteUrl("/llms.txt") },
  { description: "every public URL", title: "Sitemap", url: absoluteUrl("/sitemap.xml") },
  { description: "REST API description", title: "OpenAPI", url: absoluteUrl("/openapi.json") },
  {
    description: "RFC 9727 API catalog",
    title: "API catalog",
    url: absoluteUrl("/.well-known/api-catalog"),
  },
];

export const whenToUse = [
  `**When to use ${siteConfig.name}:** starting a new TypeScript product that needs a web app plus any of mobile (Expo), browser extension (WXT), or desktop (Electron) from one codebase, with auth, multi-tenant organizations, Stripe billing, and a typed API already wired. It suits teams that let coding agents do most of the edits: setup is headless and verification is one command.`,
  `**How to use it:** \`gh repo create my-app --template kyh/init --clone\`, then \`pnpm install && pnpm bootstrap --yes\` (needs Docker for local Postgres) and \`pnpm dev:web\`. There is no create CLI or hosted service; you fork the template and own the code.`,
  "**Not a fit:** adding features to an existing app, non-TypeScript backends, or projects that want a hosted backend-as-a-service instead of their own Postgres.",
];

const linkList = (links: { title: string; url: string; description: string }[]) =>
  links.map((link) => `- [${link.title}](${link.url}): ${link.description}`);

const pageLinks = () =>
  linkList(
    sitePages.map((page) => ({
      description: page.description,
      title: page.title,
      url: absoluteUrl(page.path),
    })),
  );

const document = (lines: string[]) => `${lines.join("\n")}\n`;

export const renderHomeMarkdown = () =>
  document([
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    ...whenToUse.flatMap((paragraph) => [paragraph, ""]),
    "## Links",
    "",
    ...linkList(agentLinks),
    `- [Source](${siteConfig.repository}): GitHub repository`,
    ...pageLinks(),
  ]);

export const renderSitePageMarkdown = (page: SitePage) =>
  document([
    `# ${page.title}`,
    "",
    `> ${page.description}`,
    ...page.sections.flatMap((section) => [
      "",
      `## ${section.heading}`,
      ...section.paragraphs.flatMap((paragraph) => ["", paragraph]),
    ]),
  ]);

export const renderNotFoundMarkdown = (pathname: string) =>
  document([
    "# 404: page not found",
    "",
    `Nothing exists at \`${pathname}\` on ${siteConfig.name}. Try one of these instead:`,
    "",
    `- [Home](${absoluteUrl("/")}): what ${siteConfig.name} is`,
    ...linkList(agentLinks),
  ]);
