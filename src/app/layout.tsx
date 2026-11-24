import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageTransition from "@/components/PageTransition";
import ScrollExperience from "@/components/ScrollExperience";
import { site } from "@/lib/content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.owner.website),
  title: {
    default: "B C H Benjamin — Computer Science Portfolio",
    template: "%s — B C H Benjamin"
  },
  description: "Portfolio of B C H Benjamin, a 5th-semester Computer Science student focused on Python development, data engineering, artificial intelligence and technical research.",
  applicationName: "B C H Benjamin — Portfolio",
  other: { "color-scheme": "dark" },
  creator: "B C H Benjamin",
  publisher: "B C H Benjamin",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site.owner.website,
    siteName: "B C H Benjamin — Portfolio",
    title: "B C H Benjamin — Computer Science Portfolio",
    description: "Python development, data engineering, artificial intelligence and technical research."
  },
  twitter: {
    card: "summary_large_image",
    title: "B C H Benjamin — Computer Science Portfolio",
    description: "Computer Science · Python Development · Data Engineering · Artificial Intelligence"
  }
};

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
        <SiteHeader />
        <PageTransition>
          <div id="main-content">{children}</div>
        </PageTransition>
        <SiteFooter />
        <ScrollExperience />
      </body>
    </html>
  );
}
