export const siteConfig = {
  author: { name: "Kaiyu Hsu", url: "https://kyh.io" },
  description: "An AI native starter kit to build, launch, and scale your next project.",
  email: "kai@kyh.io",
  name: "Init",
  ogImage: "/og.jpg",
  ogImageAlt:
    "The Init rocket logo above the tagline: An AI native starter kit to build, launch, and scale your next project.",
  /** Recorded from a built scene by `pnpm -F @repo/web og:video` (scripts/og-video); og.jpg is its poster frame. */
  ogVideo: {
    duration: "PT6.5S",
    height: 630,
    uploadDate: "2026-10-27",
    url: "/og/og.mp4",
    width: 1200,
  },
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
