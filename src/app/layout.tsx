import type { Metadata, Viewport } from "next";
import { type ReactNode } from "react";
import { SITE_ORIGIN, shareImage, summary } from "@/lib/seo";
import PortfolioTelemetry from "@/components/PortfolioTelemetry";
import { getSiteContent } from "@/lib/content";
import "./globals.css";
import "./jellybean.css";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  const ownerName = site.owner.name || "Personal Portfolio";
  const description = summary(site.owner.intro || site.owner.headline || "Professional portfolio and selected engineering work.", 300);
  const image = shareImage(site);
  const metadataBase = new URL(SITE_ORIGIN);
  const pageTitle = `${ownerName} — Portfolio`;
  return {
    metadataBase,
    title: { default: pageTitle, template: `%s — ${ownerName}` },
    description,
    applicationName: pageTitle,
    other: { "color-scheme": "dark" },
    creator: site.owner.name || undefined,
    publisher: site.owner.name || undefined,
    icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }], shortcut: "/favicon.svg" },
    openGraph: { type: "website", url: SITE_ORIGIN, siteName: pageTitle, title: pageTitle, description, images: [{url:image,width:1200,height:630,alt:pageTitle}] },
    twitter: { card: "summary_large_image", title: pageTitle, description, images: [image] }
  };
}

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>


          <div id="main-content">{children}</div>



        <PortfolioTelemetry />
      </body>
    </html>
  );
}
