import { siteConfig } from "@/lib/site-config";

import { sitePages } from "./site-pages";

import type { Block, Inline, ListItem, SitePage, TableBlock } from "./page-content";

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
  `**When to use ${siteConfig.name}:** starting a new TypeScript product that needs a web app plus any of mobile (Expo), browser extension (WXT), or desktop (Tauri) from one codebase, with auth, multi-tenant organizations, Stripe billing, and a typed API already wired. It suits teams that let coding agents do most of the edits: setup is headless and verification is one command.`,
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

const renderInline = (run: Inline) => {
  if (run.kind === "strong") {
    return `**${run.text}**`;
  }
  if (run.kind === "link") {
    return `[${run.text}](${run.href})`;
  }
  return run.text;
};

const renderRuns = (runs: Inline[]) => runs.map(renderInline).join("");

/** Nested items indent two spaces per level, under their parent's text. */
const renderListItems = (items: ListItem[], depth: number): string[] =>
  items.flatMap((entry) => [
    `${"  ".repeat(depth)}- ${renderRuns(entry.content)}`,
    ...renderListItems(entry.items, depth + 1),
  ]);

/** A pipe inside a cell would end the cell early. */
const tableRow = (cells: string[]) =>
  `| ${cells.map((cell) => cell.replaceAll("|", "\\|")).join(" | ")} |`;

const renderTable = (block: TableBlock) => [
  tableRow(block.columns),
  tableRow(block.columns.map(() => "---")),
  ...block.rows.map(tableRow),
];

const renderBlock = (block: Block): string[] => {
  switch (block.kind) {
    case "paragraph": {
      return [renderRuns(block.content)];
    }
    case "subheading": {
      return [`### ${block.text}`];
    }
    case "list": {
      return renderListItems(block.items, 0);
    }
    default: {
      return renderTable(block);
    }
  }
};

/** A blank line before each block keeps lists and tables from running into the text above. */
const renderBlocks = (blocks: Block[]) => blocks.flatMap((block) => ["", ...renderBlock(block)]);

export const renderSitePageMarkdown = (page: SitePage) =>
  document([
    `# ${page.title}`,
    "",
    `> ${page.description}`,
    ...renderBlocks(page.preamble ?? []),
    ...page.sections.flatMap((section) => [
      "",
      `## ${section.heading}`,
      ...renderBlocks(section.blocks),
    ]),
    ...(page.footnote === undefined ? [] : ["", "---", "", page.footnote]),
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
