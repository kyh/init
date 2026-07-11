import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";
import { source } from "@/lib/source";

const sitemap = (): MetadataRoute.Sitemap => {
  // Static route: evaluated once per build, so this is the deploy time.
  const lastModified = new Date();

  const docs = source.getPages().map((page) => ({
    url: `${siteConfig.url}${page.url}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    {
      url: siteConfig.url,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...docs,
  ];
};

export default sitemap;
