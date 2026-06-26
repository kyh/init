import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";
import { source } from "@/lib/source";

const sitemap = (): MetadataRoute.Sitemap => {
  const docs = source.getPages().map((page) => ({
    url: `${siteConfig.url}${page.url}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    {
      url: siteConfig.url,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...docs,
  ];
};

export default sitemap;
