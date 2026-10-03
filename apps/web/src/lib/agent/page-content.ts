/**
 * The content model of the site pages. Each page is data, rendered as HTML by
 * its route (site-page-view.tsx) and as Markdown for agents (markdown.ts), so
 * the two representations cannot drift apart.
 */

/** Plain text inside a block. */
export interface TextRun {
  kind: "text";
  text: string;
}

/** Bold text, such as a defined term or the label that opens a list item. */
export interface StrongRun {
  kind: "strong";
  text: string;
}

/** A link to an in-page anchor (`#…`), a mailto address or an absolute URL. */
export interface LinkRun {
  href: string;
  kind: "link";
  text: string;
}

export type Inline = TextRun | StrongRun | LinkRun;

export interface ListItem {
  content: Inline[];
  /** A list nested under this item; empty for most items. */
  items: ListItem[];
}

export interface ParagraphBlock {
  content: Inline[];
  kind: "paragraph";
}

/** A heading inside a section, one level below the section heading. */
export interface SubheadingBlock {
  kind: "subheading";
  text: string;
}

export interface ListBlock {
  items: ListItem[];
  kind: "list";
}

/**
 * Rendered as an HTML table and as a GFM pipe table. The caption names the table for
 * assistive technology; GFM has no caption, so the Markdown twin relies on the paragraph
 * that introduces the table, as the page does visually.
 */
export interface TableBlock {
  caption: string;
  columns: string[];
  kind: "table";
  rows: string[][];
}

export type Block = ParagraphBlock | SubheadingBlock | ListBlock | TableBlock;

export interface Section {
  blocks: Block[];
  heading: string;
}

/** One source for each trust page, rendered as HTML by its route and as Markdown for agents. */
export interface SitePage {
  path: `/${string}`;
  title: string;
  description: string;
  /** Blocks between the description and the first section, such as a legal page's date and index. */
  preamble?: Block[];
  sections: Section[];
  /** Closes the page after a divider, such as the credit a legal template asks to keep. */
  footnote?: string;
}

/** Text is plain unless it was built with `strong` or `link`. */
type Run = string | Inline;

const isPlainText = (run: Run): run is string => typeof run === "string";

const toInline = (run: Run): Inline => (isPlainText(run) ? { kind: "text", text: run } : run);

export const strong = (text: string): StrongRun => ({ kind: "strong", text });

export const link = (text: string, href: string): LinkRun => ({ href, kind: "link", text });

export const p = (...runs: Run[]): ParagraphBlock => ({
  content: runs.map(toInline),
  kind: "paragraph",
});

export const subheading = (text: string): SubheadingBlock => ({ kind: "subheading", text });

export const item = (...runs: Run[]): ListItem => ({ content: runs.map(toInline), items: [] });

/** A list item with a nested list under it. */
export const itemWithList = (runs: Run[], items: ListItem[]): ListItem => ({
  content: runs.map(toInline),
  items,
});

export const list = (...items: ListItem[]): ListBlock => ({ items, kind: "list" });

/** A list whose items are plain text. */
export const bullets = (...texts: string[]): ListBlock => list(...texts.map((text) => item(text)));

export const table = (caption: string, columns: string[], rows: string[][]): TableBlock => ({
  caption,
  columns,
  kind: "table",
  rows,
});

/**
 * The anchor id of a section heading, slugged the way GitHub slugs Markdown
 * headings (lowercase, punctuation dropped, a hyphen for each space), so the
 * HTML ids and the Markdown twin's `#` links name the same anchors.
 */
export const headingId = (heading: string) =>
  heading
    .toLowerCase()
    .replaceAll(/[^a-z0-9 _-]/gu, "")
    .replaceAll(" ", "-");

export const section = (heading: string, ...blocks: Block[]): Section => ({ blocks, heading });

/** A link to the section with this heading on the same page. */
export const sectionLink = (heading: string): LinkRun => link(heading, `#${headingId(heading)}`);

/** In-page links to each section, in order: a legal page's index. */
export const sectionIndex = (sections: Section[]): ListBlock =>
  list(...sections.map(({ heading }) => item(sectionLink(heading))));

/**
 * General Legal asks that documents made from its templates keep this credit,
 * verbatim, as their last paragraph.
 */
export const GENERAL_LEGAL_CREDIT =
  'This template was prepared and made publicly available by General Legal, PC ("General Legal"). It is provided for general reference purposes only and does not constitute, and should not be construed as, legal advice, or an endorsement or review of any particular transaction in which it is used. Use of this template does not create an attorney-client relationship with General Legal. General Legal has not reviewed, and takes no position on, any modifications made to this document or the deal terms it is used to document.';
