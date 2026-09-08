import type { InferPageType } from "fumadocs-core/source";
import { loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";

import { docs } from "../../.source/server";

export const source = loader({
  baseUrl: "/docs",
  plugins: [lucideIconsPlugin()],
  source: docs.toFumadocsSource(),
});

export const getLLMText = async (page: InferPageType<typeof source>) => {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title}

${processed}`;
};
