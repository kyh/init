import { siteConfig } from "@/lib/site-config";

/** One source for each trust page, rendered as HTML by its route and as Markdown for agents. */
export interface SitePage {
  path: `/${string}`;
  title: string;
  description: string;
  sections: { heading: string; paragraphs: string[] }[];
}

export const about: SitePage = {
  description: `What ${siteConfig.name} is, who maintains it, and how it is licensed.`,
  path: "/about",
  sections: [
    {
      heading: "What it is",
      paragraphs: [
        `${siteConfig.name} is an open-source, MIT-licensed starter kit for TypeScript products. One pnpm and Turborepo monorepo ships a Next.js web app, an Expo mobile app, a WXT browser extension, and an Electron desktop app, all sharing one typed API built on oRPC, better-auth, Drizzle ORM, and Postgres.`,
        "It comes with the plumbing most products rebuild from scratch: email and GitHub sign-in, multi-tenant organizations with roles and invitations, Stripe subscriptions, transactional email through Resend, avatar uploads to Vercel Blob, and documentation built with Fumadocs.",
      ],
    },
    {
      heading: "Built for coding agents",
      paragraphs: [
        "The template is designed to be driven end to end by a coding agent. pnpm bootstrap --yes provisions Postgres, environment, schema, and a seeded login with no prompts; agent-browser drives the real web app; a local emulator stands in for GitHub so sign-in works offline; and pnpm verify runs the same typecheck, lint, format, and test gate as CI. AGENTS.md and CLAUDE.md describe the conventions agents should follow.",
      ],
    },
    {
      heading: "Who maintains it",
      paragraphs: [
        `${siteConfig.name} is maintained by ${siteConfig.author.name} (${siteConfig.author.url}) as a personal open-source project. The source, issue tracker, and releases live on GitHub at ${siteConfig.repository}. This site, ${siteConfig.url}, is the template's live demo and documentation.`,
      ],
    },
  ],
  title: `About ${siteConfig.name}`,
};

export const contact: SitePage = {
  description: `How to reach the maintainer of ${siteConfig.name}.`,
  path: "/contact",
  sections: [
    {
      heading: "Email",
      paragraphs: [
        `Write to ${siteConfig.email} for questions about the template, licensing, security reports, or anything about this site. This is a personal inbox, so replies may take a few days.`,
      ],
    },
    {
      heading: "GitHub",
      paragraphs: [
        `Bugs, feature requests, and questions about the code are best filed as issues at ${siteConfig.repository}/issues, where other users can find the answer too. Pull requests are welcome; read AGENTS.md in the repository first, since it documents the conventions the checks enforce.`,
      ],
    },
    {
      heading: "Security",
      paragraphs: [
        `Please report vulnerabilities privately by email to ${siteConfig.email} rather than in a public issue, and include steps to reproduce. You will get an acknowledgment once the report has been read.`,
      ],
    },
  ],
  title: `Contact ${siteConfig.name}`,
};

export const privacy: SitePage = {
  description: "What this site stores about you and why.",
  path: "/privacy",
  sections: [
    {
      heading: "What this site collects",
      paragraphs: [
        "If you join the waitlist, the site stores the email address you entered. If you create an account, it stores your name, email address, password hash (or your GitHub account identifier if you sign in with GitHub), and an optional profile picture, which is uploaded to Vercel Blob storage.",
        "Each signed-in session records the IP address and browser user agent that created it, to help secure your account. Organizations, memberships, invitations, and the sample todos you create are stored so the app can show them back to you.",
      ],
    },
    {
      heading: "What it does not do",
      paragraphs: [
        "The site runs no third-party analytics, advertising, or tracking scripts, and its only cookies are the ones that keep you signed in. Your light or dark theme choice stays in your browser's local storage. Your data is not sold or shared for marketing.",
      ],
    },
    {
      heading: "Services that process data",
      paragraphs: [
        "Data is stored in a Postgres database and served from Vercel. Transactional email such as verification and password-reset links is sent through Resend. If you start a paid subscription, payment details are handled by Stripe and never reach this site's servers.",
      ],
    },
    {
      heading: "Your choices",
      paragraphs: [
        `You can delete organizations you own from the dashboard. To have your account or waitlist entry removed, email ${siteConfig.email} and it will be deleted.`,
      ],
    },
  ],
  title: "Privacy Policy",
};

export const sitePages = [about, contact, privacy];

export const findSitePage = (path: string): SitePage | undefined =>
  sitePages.find((page) => page.path === path);
