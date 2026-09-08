import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";
import { source } from "@/lib/source";

const sitemap = (): MetadataRoute.Sitemap => {
  // Static route: evaluated once per build, so this is the deploy time.
  const lastModified = new Date();

  const docs = source.getPages().map((page) => ({
    changeFrequency: "weekly" as const,
    lastModified,
    priority: 0.5,
    url: `${siteConfig.url}${page.url}`,
  }));

  return [
    {
      changeFrequency: "weekly",
      lastModified,
      priority: 1,
      url: siteConfig.url,
    },
    ...docs,
  ];
};

export default sitemap;
