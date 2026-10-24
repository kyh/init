import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { Logo } from "@repo/ui/components/logo";

import { siteConfig } from "@/lib/site-config";
import { getPageImage, source } from "@/lib/source";

// The site's dark tokens (@repo/ui globals.css: --background, --foreground,
// --muted-foreground, --border), as sRGB, since the image renderer takes no oklch.
const BACKGROUND = "#09090b";
const FOREGROUND = "#fafafa";
const MUTED = "#9f9fa9";
const BORDER = "rgba(255, 255, 255, 0.1)";

const sectionTitle = (slugs: string[]) => {
  const [folder] = slugs;
  if (!folder || slugs.length < 2) {
    return "Documentation";
  }
  return folder.charAt(0).toUpperCase() + folder.slice(1);
};

/** One 1200×630 card per docs page: section, title, description, prerendered at build. */
export const GET = async (_request: Request, props: { params: Promise<{ slug: string[] }> }) => {
  const { slug } = await props.params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) {
    notFound();
  }

  return new ImageResponse(
    <div
      style={{
        background: BACKGROUND,
        color: FOREGROUND,
        display: "flex",
        height: "100%",
        padding: 40,
        width: "100%",
      }}
    >
      <div
        style={{
          border: `1px solid ${BORDER}`,
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 20 }}>
          <Logo width={56} height={56} />
          <span style={{ color: MUTED, fontSize: 30 }}>
            {siteConfig.name} · {sectionTitle(page.slugs)}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 72, letterSpacing: -1.5, lineHeight: 1.05 }}>
            {page.data.title}
          </div>
          {page.data.description ? (
            <div style={{ color: MUTED, fontSize: 32, lineHeight: 1.35, maxWidth: 960 }}>
              {page.data.description}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    { height: 630, width: 1200 },
  );
};

export const generateStaticParams = () =>
  source.getPages().map((page) => ({ slug: getPageImage(page).segments }));
