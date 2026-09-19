export const siteConfig = {
  description: "An AI native starter kit to build, launch, and scale your next project.",
  name: "Init",
  ogImage: "/og.jpg",
  shortName: "Init",
  twitter: "@kaiyuhsu",
  // SITE_URL supports non-Vercel deployments.
  url:
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
};
