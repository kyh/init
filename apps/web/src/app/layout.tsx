import type { Metadata, Viewport } from "next";
import { GlobalAlertDialog } from "@repo/ui/components/alert-dialog";
import { Toaster } from "@repo/ui/components/sonner";
import { TooltipProvider } from "@repo/ui/components/tooltip";

import { DesktopMenuListener } from "@/components/desktop-menu-listener";
import { DesktopUpdateBanner } from "@/components/desktop-update-banner";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/lib/site-config";
import { ORPCReactProvider } from "@/orpc/react";

import "./styles/globals.css";

export const metadata: Metadata = {
  description: siteConfig.description,
  icons: [
    {
      rel: "icon",
      sizes: "96x96",
      type: "image/png",
      url: "/favicon/favicon-96x96.png",
    },
    {
      rel: "icon",
      type: "image/svg+xml",
      url: "/favicon/favicon.svg",
    },
    {
      rel: "shortcut icon",
      url: "/favicon/favicon.ico",
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: "/favicon/apple-touch-icon.png",
    },
    {
      rel: "manifest",
      url: "/favicon/site.webmanifest",
    },
  ],
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    description: siteConfig.description,
    images: [
      {
        height: 630,
        url: siteConfig.ogImage,
        width: 1200,
      },
    ],
    locale: "en-US",
    siteName: siteConfig.name,
    title: siteConfig.name,
    type: "website",
    url: siteConfig.url,
  },
  other: {
    "apple-mobile-web-app-title": siteConfig.shortName,
  },
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  twitter: {
    card: "summary_large_image",
    creator: siteConfig.twitter,
    description: siteConfig.description,
    images: [
      {
        height: 630,
        url: siteConfig.ogImage,
        width: 1200,
      },
    ],
    title: siteConfig.name,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { color: "white", media: "(prefers-color-scheme: light)" },
    { color: "black", media: "(prefers-color-scheme: dark)" },
  ],
};

interface LayoutProps {
  children: React.ReactNode;
}

const RootLayout = (props: LayoutProps) => (
  <html lang="en" suppressHydrationWarning>
    <body className="bg-background text-foreground font-sans antialiased">
      <ThemeProvider>
        <TooltipProvider>
          <ORPCReactProvider>{props.children}</ORPCReactProvider>
          <Toaster />
          <GlobalAlertDialog />
          <DesktopMenuListener />
          <DesktopUpdateBanner />
        </TooltipProvider>
      </ThemeProvider>
    </body>
  </html>
);

export default RootLayout;
