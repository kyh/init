export const siteConfig = {
  author: { name: "Kaiyu Hsu", url: "https://kyh.io" },
  description: "An AI native starter kit to build, launch, and scale your next project.",
  email: "kai@kyh.io",
  name: "Init",
  ogImage: "/og.jpg",
  repository: "https://github.com/kyh/init",
  sameAs: ["https://github.com/kyh/init", "https://twitter.com/kaiyuhsu"],
  shortName: "Init",
  twitter: "@kaiyuhsu",
  // SITE_URL supports non-Vercel deployments.
  url:
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
};
