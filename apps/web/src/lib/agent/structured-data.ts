import { siteConfig } from "@/lib/site-config";

import { absoluteUrl } from "./markdown";

/** Plain JSON; `undefined` is allowed because `JSON.stringify` drops those keys. */
export type JsonLdValue = string | number | boolean | null | undefined | JsonLdValue[] | JsonLdNode;

export interface JsonLdNode {
  [key: string]: JsonLdValue;
}

const ORGANIZATION_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

/**
 * No `address` or `telephone`: this is a personal open-source project with no
 * premises or phone line, and a made-up PostalAddress would be worse than none.
 */
export const buildOrganization = () => ({
  "@id": ORGANIZATION_ID,
  "@type": "Organization",
  contactPoint: {
    "@type": "ContactPoint",
    availableLanguage: ["en"],
    contactType: "customer support",
    email: siteConfig.email,
    url: absoluteUrl("/contact"),
  },
  description: siteConfig.description,
  email: siteConfig.email,
  founder: { "@type": "Person", name: siteConfig.author.name, url: siteConfig.author.url },
  logo: absoluteUrl("/logo.svg"),
  name: siteConfig.name,
  sameAs: siteConfig.sameAs,
  url: siteConfig.url,
});

/** The og:video clip, as the home page's VideoObject. */
export const buildVideoObject = () => ({
  "@id": `${siteConfig.url}/#video`,
  "@type": "VideoObject",
  contentUrl: absoluteUrl(siteConfig.ogVideo.url),
  description: siteConfig.ogImageAlt,
  duration: siteConfig.ogVideo.duration,
  height: siteConfig.ogVideo.height,
  name: `${siteConfig.name}: the rocket launches`,
  publisher: { "@id": ORGANIZATION_ID },
  thumbnailUrl: absoluteUrl(siteConfig.ogImage),
  uploadDate: siteConfig.ogVideo.uploadDate,
  width: siteConfig.ogVideo.width,
});

export const buildHomeGraph = () => ({
  "@context": "https://schema.org",
  "@graph": [
    buildOrganization(),
    {
      "@id": WEBSITE_ID,
      "@type": "WebSite",
      description: siteConfig.description,
      inLanguage: "en-US",
      name: siteConfig.name,
      publisher: { "@id": ORGANIZATION_ID },
      url: siteConfig.url,
    },
    buildVideoObject(),
    {
      "@type": "SoftwareSourceCode",
      codeRepository: siteConfig.repository,
      description: siteConfig.description,
      isAccessibleForFree: true,
      license: "https://opensource.org/licenses/MIT",
      name: siteConfig.name,
      programmingLanguage: "TypeScript",
      publisher: { "@id": ORGANIZATION_ID },
      url: siteConfig.url,
    },
  ],
});

export interface DocGraphInput {
  title: string;
  description?: string;
  /** Site-relative, e.g. `/docs/build/queries`. */
  path: string;
  /** Site-relative URL of the page's OpenGraph image. */
  image: string;
  /** Last commit to the page's source, when known. */
  lastModified?: Date;
}

/** A docs page: a TechArticle plus its BreadcrumbList (Home › Documentation › page). */
export const buildDocGraph = (doc: DocGraphInput) => {
  const url = absoluteUrl(doc.path);
  const crumbs = [
    { name: siteConfig.name, url: siteConfig.url },
    { name: "Documentation", url: absoluteUrl("/docs") },
    ...(doc.path === "/docs" ? [] : [{ name: doc.title, url }]),
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": `${url}#article`,
        "@type": "TechArticle",
        author: { "@type": "Person", name: siteConfig.author.name, url: siteConfig.author.url },
        dateModified: doc.lastModified?.toISOString(),
        description: doc.description,
        headline: doc.title,
        image: absoluteUrl(doc.image),
        inLanguage: "en-US",
        isPartOf: { "@id": WEBSITE_ID },
        mainEntityOfPage: url,
        publisher: { "@id": ORGANIZATION_ID },
        url,
      },
      {
        "@id": `${url}#breadcrumb`,
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((crumb, index) => ({
          "@type": "ListItem",
          item: crumb.url,
          name: crumb.name,
          position: index + 1,
        })),
      },
    ],
  };
};

/** Escapes `<` so no value can close the surrounding `<script>` early. */
export const serializeJsonLd = (graph: JsonLdNode) =>
  JSON.stringify(graph).replaceAll("<", "\\u003c");
