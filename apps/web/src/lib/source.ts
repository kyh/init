import type { InferPageType } from "fumadocs-core/source";
import { loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";

import { docs } from "../../.source/server";

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: `/og/docs/${segments.join("/")}`,
  };
}

export function getLLMText(page: InferPageType<typeof source>) {
  // In fumadocs v16, processed markdown is available through the page's file data
  // Access it via the underlying file structure if includeProcessedMarkdown is enabled
  // Type assertion needed as the processed property may not be in the type definitions
  const processed = (page.data as typeof page.data & { processed?: string }).processed;

  return `# ${page.data.title}

${processed ?? ""}`;
}
