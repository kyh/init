import { notFound } from "next/navigation";

import { ogCardResponse } from "@/app/og/_components/og-card";
import { getPageImage, source } from "@/lib/source";

const sectionTitle = (slugs: string[]) => {
  const [folder] = slugs;
  if (!folder || slugs.length < 2) {
    return "Documentation";
  }
  return folder.charAt(0).toUpperCase() + folder.slice(1);
};

/** One card per docs page: section, title, description, prerendered at build. */
export const GET = async (_request: Request, props: { params: Promise<{ slug: string[] }> }) => {
  const { slug } = await props.params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) {
    notFound();
  }

  return ogCardResponse({
    description: page.data.description,
    eyebrow: sectionTitle(page.slugs),
    title: page.data.title,
  });
};

export const generateStaticParams = () =>
  source.getPages().map((page) => ({ slug: getPageImage(page).segments }));
