import type { Metadata } from "next";

import type { SitePage } from "@/lib/agent/site-pages";

export const sitePageMetadata = (page: SitePage): Metadata => ({
  alternates: { canonical: page.path },
  description: page.description,
  title: page.title,
});

export const SitePageView = ({ page }: { page: SitePage }) => (
  <section>
    <div className="border-border mx-auto max-w-7xl border-x border-b p-8 lg:py-24">
      <article className="max-w-2xl">
        <h1 className="text-secondary-foreground text-2xl font-light text-pretty">{page.title}</h1>
        <p className="text-muted-foreground mt-4 font-light">{page.description}</p>
        {page.sections.map((section) => (
          <div key={section.heading} className="mt-10 space-y-3">
            <h2 className="text-secondary-foreground">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </article>
    </div>
  </section>
);
