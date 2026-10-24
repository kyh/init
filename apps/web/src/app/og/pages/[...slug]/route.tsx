import { notFound } from "next/navigation";

import { ogCardResponse } from "@/app/og/_components/og-card";
import { findSitePage, sitePages } from "@/lib/agent/site-pages";
import { sitePageImage } from "@/lib/page-metadata";

const LEGAL_PAGES = new Set(["/privacy", "/terms"]);

/** One card per marketing page (about, contact, privacy, terms), prerendered at build. */
export const GET = async (_request: Request, props: { params: Promise<{ slug: string[] }> }) => {
  const { slug } = await props.params;
  const page = findSitePage(`/${slug.slice(0, -1).join("/")}`);
  if (!page) {
    notFound();
  }

  const eyebrow = LEGAL_PAGES.has(page.path) ? "Legal" : "Project";
  return ogCardResponse({ description: page.description, eyebrow, title: page.title });
};

export const generateStaticParams = () =>
  sitePages.map((page) => ({ slug: sitePageImage(page.path).segments }));
