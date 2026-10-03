import { siteConfig } from "@/lib/site-config";

import type { SitePage } from "./page-content";
import { p, section } from "./page-content";
import { privacy } from "./privacy-policy";
import { terms } from "./terms-of-use";

export const about: SitePage = {
  description: `What ${siteConfig.name} is, who maintains it, and how it is licensed.`,
  path: "/about",
  sections: [
    section(
      "What it is",
      p(
        `${siteConfig.name} is an open-source, MIT-licensed starter kit for TypeScript products. One pnpm and Turborepo monorepo ships a Next.js web app, an Expo mobile app, a WXT browser extension, and an Electron desktop app, all sharing one typed API built on oRPC, better-auth, Drizzle ORM, and Postgres.`,
      ),
      p(
        "It comes with the plumbing most products rebuild from scratch: email and GitHub sign-in, multi-tenant organizations with roles and invitations, Stripe subscriptions, transactional email through Resend, avatar uploads to Vercel Blob, and documentation built with Fumadocs.",
      ),
    ),
    section(
      "Built for coding agents",
      p(
        "The template is designed to be driven end to end by a coding agent. pnpm bootstrap --yes provisions Postgres, environment, schema, and a seeded login with no prompts; agent-browser drives the real web app; a local emulator stands in for GitHub so sign-in works offline; and pnpm verify runs the same typecheck, lint, format, and test gate as CI. AGENTS.md and CLAUDE.md describe the conventions agents should follow.",
      ),
    ),
    section(
      "Who maintains it",
      p(
        `${siteConfig.name} is maintained by ${siteConfig.author.name} (${siteConfig.author.url}) as a personal open-source project. The source, issue tracker, and releases live on GitHub at ${siteConfig.repository}. This site, ${siteConfig.url}, is the template's live demo and documentation.`,
      ),
    ),
  ],
  title: `About ${siteConfig.name}`,
};

export const contact: SitePage = {
  description: `How to reach the maintainer of ${siteConfig.name}.`,
  path: "/contact",
  sections: [
    section(
      "Email",
      p(
        `Write to ${siteConfig.email} for questions about the template, licensing, security reports, or anything about this site. This is a personal inbox, so replies may take a few days.`,
      ),
    ),
    section(
      "GitHub",
      p(
        `Bugs, feature requests, and questions about the code are best filed as issues at ${siteConfig.repository}/issues, where other users can find the answer too. Pull requests are welcome; read AGENTS.md in the repository first, since it documents the conventions the checks enforce.`,
      ),
    ),
    section(
      "Security",
      p(
        `Please report vulnerabilities privately by email to ${siteConfig.email} rather than in a public issue, and include steps to reproduce. You will get an acknowledgment once the report has been read.`,
      ),
    ),
  ],
  title: `Contact ${siteConfig.name}`,
};

export const sitePages = [about, contact, privacy, terms];

export const findSitePage = (path: string): SitePage | undefined =>
  sitePages.find((page) => page.path === path);
