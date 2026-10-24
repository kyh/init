import type { Metadata } from "next";

import { siteConfig } from "@/lib/site-config";

interface PageImage {
  url: string;
  alt: string;
}

interface PageMetadataInput {
  /** Omitted on the home page, which keeps the root layout's default title. */
  title?: string;
  description: string;
  /** Site-relative, starting with `/`. */
  path: string;
  type?: "website" | "article";
  /** Defaults to the site's OpenGraph image. */
  image?: PageImage;
  /** Attaches the site's og:video clip (marketing pages). */
  video?: boolean;
}

const OG_SIZE = { height: 630, width: 1200 };

const siteImage: PageImage = { alt: siteConfig.ogImageAlt, url: siteConfig.ogImage };

// Next resolves image URLs against metadataBase but not video URLs, so these are absolute.
const videoUrl = `${siteConfig.url}${siteConfig.ogVideo.url}`;
const siteVideo = {
  height: siteConfig.ogVideo.height,
  secureUrl: videoUrl,
  type: "video/mp4",
  url: videoUrl,
  width: siteConfig.ogVideo.width,
};

/**
 * A page's canonical, OpenGraph and Twitter fields. Next does not field-merge
 * `openGraph` or `twitter` with a parent's, so every page that sets one must set
 * all of it, or shares fall back to the home page's URL and title.
 * Relative URLs resolve against the root layout's `metadataBase`.
 */
export const pageMetadata = (input: PageMetadataInput): Metadata => {
  const title = input.title ?? siteConfig.name;
  const image = input.image ?? siteImage;
  const images = [{ ...OG_SIZE, alt: image.alt, url: image.url }];

  const openGraph: NonNullable<Metadata["openGraph"]> = {
    description: input.description,
    images,
    locale: "en_US",
    siteName: siteConfig.name,
    title,
    type: input.type ?? "website",
    url: input.path,
  };
  if (input.video) {
    openGraph.videos = [siteVideo];
  }

  const metadata: Metadata = {
    alternates: { canonical: input.path },
    description: input.description,
    openGraph,
    twitter: {
      card: "summary_large_image",
      creator: siteConfig.twitter,
      description: input.description,
      images,
      title,
    },
  };
  if (input.title) {
    metadata.title = input.title;
  }
  return metadata;
};
