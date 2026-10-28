import type { Metadata, Viewport } from "next";
import { GlobalAlertDialog } from "@repo/ui/components/alert-dialog";
import { Toaster } from "@repo/ui/components/sonner";
import { TooltipProvider } from "@repo/ui/components/tooltip";

import { DesktopMenuListener } from "@/components/desktop-menu-listener";
import { DesktopUpdateBanner } from "@/components/desktop-update-banner";
import { ThemeProvider } from "@/components/theme-provider";
import { pageMetadata } from "@/lib/page-metadata";
import { siteConfig } from "@/lib/site-config";
import { ORPCReactProvider } from "@/orpc/react";

import "./styles/globals.css";

// The fallback share card for any route that sets none; no canonical here, since a
// layout's would be inherited by every page that forgot its own.
const { openGraph, twitter } = pageMetadata({
  description: siteConfig.description,
  path: "/",
  video: true,
});

export const metadata: Metadata = {
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.author.name,
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
  openGraph,
  other: {
    "apple-mobile-web-app-title": siteConfig.shortName,
  },
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  twitter,
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
