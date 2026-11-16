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
    default: "Benjamin — Software, AI & Systems",
    template: "%s — Benjamin"
  },
  description: "The portfolio of Benjamin — Computer Science & Engineering student building across full-stack software, applied AI, data and edge systems.",
  applicationName: "Benjamin — Portfolio",
  creator: "Benjamin",
  publisher: "Benjamin",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site.owner.website,
    siteName: "Benjamin — Portfolio",
    title: "Benjamin — Software, AI & Systems",
    description: "Practical software at the intersection of intelligent systems and thoughtful product engineering."
  },
  twitter: {
    card: "summary_large_image",
    title: "Benjamin — Software, AI & Systems",
    description: "Building useful software for complex, real-world problems."
  }
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
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
