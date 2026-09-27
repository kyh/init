interface Match {
  quality: number;
  /** Full wildcard = 0, `type/*` = 1, exact = 2; -1 when nothing matched. */
  specificity: number;
}

const specificityOf = (range: string, mediaType: string, type: string | undefined) => {
  if (range === mediaType) {
    return 2;
  }
  if (range === `${type}/*`) {
    return 1;
  }
  return range === "*/*" ? 0 : -1;
};

/** The most specific Accept range matching `mediaType` sets its quality (RFC 9110 §12.5.1). */
const matchOf = (accept: string, mediaType: string): Match => {
  const [type] = mediaType.split("/");
  let best: Match = { quality: 0, specificity: -1 };

  for (const entry of accept.split(",")) {
    const [range = "", ...params] = entry.split(";").map((part) => part.trim().toLowerCase());
    const specificity = specificityOf(range, mediaType, type);
    if (specificity <= best.specificity) {
      continue;
    }
    const q = params.find((param) => param.startsWith("q="));
    const parsed = q ? Number(q.slice(2)) : 1;
    best = { quality: Number.isNaN(parsed) ? 1 : Math.min(Math.max(parsed, 0), 1), specificity };
  }

  return best;
};

/**
 * Markdown only when the client names it explicitly and ranks it at least as
 * high as HTML. Wildcards alone keep the default HTML, so browsers never flip.
 */
export const prefersMarkdown = (accept: string | null) => {
  if (!accept) {
    return false;
  }
  const markdown = matchOf(accept, "text/markdown");
  return (
    markdown.specificity === 2 &&
    markdown.quality > 0 &&
    markdown.quality >= matchOf(accept, "text/html").quality
  );
};
