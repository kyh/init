export const siteConfig = {
  name: "Init",
  shortName: "Init",
  description: "An AI native starter kit to build, launch, and scale your next project.",
  // SITE_URL supports non-Vercel deployments.
  url:
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  ogImage: "/og.jpg",
  twitter: "@kaiyuhsu",
};
