import { env } from "@/env";

export const siteConfig = {
  name: "Init",
  shortName: "Init",
  description: "An AI native starter kit to build, launch, and scale your next project.",
  // Server-only (these env vars are not exposed to the client); every current
  // consumer is a server context (metadata, sitemap, robots). SITE_URL is the
  // escape hatch for non-Vercel hosts, where the Vercel var doesn't exist.
  url:
    env.SITE_URL ??
    (env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  ogImage: "/og.jpg",
  twitter: "@kaiyuhsu",
};
