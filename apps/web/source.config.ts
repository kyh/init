import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from "fumadocs-mdx/config";
import { z } from "zod";

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.vercel.app/docs/mdx/collections#define-docs
export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
    // `lastModified` is hand-set in each page's frontmatter (`lastModified: 2026-10-27`):
    // the sitemap's lastmod and the TechArticle's dateModified. Required, so a page
    // without one fails the build rather than shipping with no date. Bump it when
    // the page's content changes.
    schema: frontmatterSchema.extend({
      lastModified: z.coerce.date(),
    }),
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {},
});
