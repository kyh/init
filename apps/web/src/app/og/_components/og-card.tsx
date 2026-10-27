import { ImageResponse } from "next/og";
import { Logo } from "@repo/ui/components/logo";

import { siteConfig } from "@/lib/site-config";

// The site's dark tokens (@repo/ui globals.css: --background, --foreground,
// --muted-foreground, --border), as sRGB, since the image renderer takes no oklch.
const BACKGROUND = "#09090b";
const FOREGROUND = "#fafafa";
const MUTED = "#9f9fa9";
const BORDER = "rgba(255, 255, 255, 0.1)";

interface OgCardProps {
  /** Shown after the site name, e.g. the docs section. */
  eyebrow: string;
  title: string;
  description?: string;
}

/** The one 1200×630 share card every page but home uses, so they all match. */
export const ogCardResponse = ({ eyebrow, title, description }: OgCardProps) =>
  new ImageResponse(
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
            {siteConfig.name} · {eyebrow}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 72, letterSpacing: -1.5, lineHeight: 1.05 }}>{title}</div>
          {description ? (
            <div style={{ color: MUTED, fontSize: 32, lineHeight: 1.35, maxWidth: 960 }}>
              {description}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    { height: 630, width: 1200 },
  );
