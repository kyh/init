import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";

import { buildDocGraph, serializeJsonLd } from "@/lib/agent/structured-data";
import { pageMetadata } from "@/lib/page-metadata";
import { siteConfig } from "@/lib/site-config";
import { getPageImage, source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";

// Docs are build-time content: every page is prerendered, and an unknown slug waits on its
// static render, so notFound() answers a real 404 instead of a streamed fallback shell.
export const ensureStatic = "navigation";

const Page = async (props: { params: Promise<{ slug?: string[] }> }) => {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) {
    notFound();
  }

  const MDXContent = page.data.body;
  const jsonLdScript = serializeJsonLd(
    buildDocGraph({
      description: page.data.description,
      image: getPageImage(page).url,
      lastModified: page.data.lastModified,
      path: page.url,
      title: page.data.title,
    }),
  );

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      {/* oxlint-disable-next-line react/no-danger -- JSON-LD must be inline script text; serializeJsonLd escapes `<` */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript }} />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDXContent
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
};

export const generateStaticParams = () => source.generateParams();

export const generateMetadata = async (props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    notFound();
  }

  return pageMetadata({
    description: page.data.description ?? siteConfig.description,
    image: { alt: `${page.data.title} — ${siteConfig.name} docs`, url: getPageImage(page).url },
    path: page.url,
    title: page.data.title,
    type: "article",
  });
};

export default Page;
