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

export async function getLLMText(page: InferPageType<typeof source>) {
  // Processed markdown is exposed via getText('processed'), enabled by
  // `includeProcessedMarkdown` in source.config.ts.
  const processed = await page.data.getText("processed");

  return `# ${page.data.title}

${processed}`;
}
