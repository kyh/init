import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";

import { siteConfig } from "@/lib/site-config";
import { source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";

const Page = async (props: { params: Promise<{ slug?: string[] }> }) => {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) {
    notFound();
  }

  const MDXContent = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
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

  return {
    alternates: {
      canonical: page.url,
    },
    description: page.data.description,
    // openGraph/twitter don't field-merge with the root layout's — without
    // these, shared docs links fall back to the generic site title.
    openGraph: {
      description: page.data.description,
      images: [{ height: 630, url: siteConfig.ogImage, width: 1200 }],
      siteName: siteConfig.name,
      title: page.data.title,
      type: "article",
      url: page.url,
    },
    title: page.data.title,
    twitter: {
      card: "summary_large_image",
      creator: siteConfig.twitter,
      description: page.data.description,
      images: [{ height: 630, url: siteConfig.ogImage, width: 1200 }],
      title: page.data.title,
    },
  };
};

export default Page;
