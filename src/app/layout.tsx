import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageTransition from "@/components/PageTransition";
import ScrollExperience from "@/components/ScrollExperience";
import { getSiteContent } from "@/lib/content";
import "./globals.css";
import "./jellybean.css";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  const ownerName = site.owner.name || "Personal Portfolio";
  const description = (site.owner.intro || site.owner.headline || "Professional portfolio and selected engineering work.").slice(0, 320);
  let metadataBase: URL;
  try { metadataBase = new URL(site.owner.website || "https://www.bchbenjamin.in"); }
  catch { metadataBase = new URL("https://www.bchbenjamin.in"); }
  const pageTitle = `${ownerName} — Portfolio`;
  return {
    metadataBase,
    title: { default: pageTitle, template: `%s — ${ownerName}` },
    description,
    applicationName: pageTitle,
    other: { "color-scheme": "dark" },
    creator: site.owner.name || undefined,
    publisher: site.owner.name || undefined,
    alternates: { canonical: "/" },
    icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }], shortcut: "/favicon.svg" },
    openGraph: { type: "website", url: site.owner.website || metadataBase.toString(), siteName: pageTitle, title: pageTitle, description },
    twitter: { card: "summary_large_image", title: pageTitle, description }
  };
}

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const site = await getSiteContent();
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader ownerName={site.owner.name} />
        <PageTransition>
          <div id="main-content">{children}</div>
        </PageTransition>
        <SiteFooter ownerName={site.owner.name} github={site.owner.github} linkedin={site.owner.linkedin} email={site.owner.email} />
        <ScrollExperience />
      </body>
    </html>
  );
}
