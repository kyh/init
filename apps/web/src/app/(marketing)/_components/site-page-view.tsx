import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "cn";

import type { Block, Inline, ListItem, SitePage, TableBlock } from "@/lib/agent/page-content";
import { headingId } from "@/lib/agent/page-content";

export const sitePageMetadata = (page: SitePage): Metadata => ({
  alternates: { canonical: page.path },
  description: page.description,
  title: page.title,
});

const Runs = ({ runs }: { runs: Inline[] }) =>
  runs.map((run, index) => {
    if (run.kind === "strong") {
      return (
        <strong key={index} className="text-secondary-foreground font-normal">
          {run.text}
        </strong>
      );
    }
    if (run.kind === "link") {
      return (
        <Link
          key={index}
          className="hover:text-secondary-foreground underline underline-offset-4 transition"
          href={run.href}
        >
          {run.text}
        </Link>
      );
    }
    return run.text;
  });

const ListItems = ({ items, nested }: { items: ListItem[]; nested: boolean }) => (
  <ul className={cn("space-y-2 pl-5", nested ? "mt-2 list-[circle]" : "max-w-2xl list-disc")}>
    {items.map((entry, index) => (
      <li key={index}>
        <Runs runs={entry.content} />
        {entry.items.length > 0 && <ListItems items={entry.items} nested />}
      </li>
    ))}
  </ul>
);

/** Tables break out of the prose measure and scroll sideways rather than squeeze their columns. */
const Table = ({ block }: { block: TableBlock }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
      <caption className="sr-only">{block.caption}</caption>
      <thead>
        <tr>
          {block.columns.map((column) => (
            <th
              key={column}
              scope="col"
              className="border-border text-secondary-foreground border p-2 align-top font-normal"
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {block.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="border-border border p-2 align-top">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const BlockView = ({ block }: { block: Block }) => {
  switch (block.kind) {
    case "paragraph": {
      return (
        <p className="max-w-2xl">
          <Runs runs={block.content} />
        </p>
      );
    }
    case "subheading": {
      return <h3 className="text-secondary-foreground max-w-2xl pt-4">{block.text}</h3>;
    }
    case "list": {
      return <ListItems items={block.items} nested={false} />;
    }
    default: {
      return <Table block={block} />;
    }
  }
};

const Blocks = ({ blocks }: { blocks: Block[] }) =>
  blocks.map((block, index) => <BlockView key={index} block={block} />);

export const SitePageView = ({ page }: { page: SitePage }) => (
  <section>
    <div className="border-border mx-auto max-w-7xl border-x border-b p-8 lg:py-24">
      <article className="text-muted-foreground">
        <h1 className="text-secondary-foreground max-w-2xl text-2xl font-light text-pretty">
          {page.title}
        </h1>
        <p className="mt-4 max-w-2xl font-light">{page.description}</p>
        {page.preamble === undefined ? null : (
          <div className="mt-10 space-y-3">
            <Blocks blocks={page.preamble} />
          </div>
        )}
        {page.sections.map((section) => (
          <div key={section.heading} className="mt-10 space-y-3">
            <h2 id={headingId(section.heading)} className="text-secondary-foreground max-w-2xl">
              {section.heading}
            </h2>
            <Blocks blocks={section.blocks} />
          </div>
        ))}
        {page.footnote === undefined ? null : (
          <>
            <hr className="border-border mt-10 max-w-2xl" />
            <p className="mt-6 max-w-2xl text-sm">{page.footnote}</p>
          </>
        )}
      </article>
    </div>
  </section>
);
