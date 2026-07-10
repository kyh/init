export const siteConfig = {
  name: "Init",
  shortName: "Init",
  description: "An AI native starter kit to build, launch, and scale your next project.",
  // Server-only (VERCEL_PROJECT_PRODUCTION_URL is not exposed to the client);
  // every current consumer is a server context (metadata, sitemap, robots)
  url: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000",
  twitter: "@kaiyuhsu",
};
