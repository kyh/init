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

/** Escapes `<` so no value can close the surrounding `<script>` early. */
export const serializeJsonLd = (graph: JsonLdNode) =>
  JSON.stringify(graph).replaceAll("<", "\\u003c");
