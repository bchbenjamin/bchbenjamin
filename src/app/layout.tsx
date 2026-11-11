import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bchbenjamin.in"),
  title: {
    default: "bchbenjamin — software engineer",
    template: "%s — bchbenjamin",
  },
  description:
    "Portfolio of Benjamin: projects, experience and a small stack of tools he actually uses.",
  openGraph: {
    type: "website",
    url: "https://bchbenjamin.in",
    siteName: "bchbenjamin",
    title: "bchbenjamin — software engineer",
    description:
      "Portfolio of Benjamin: projects, experience and a small stack of tools he actually uses.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-dvh bg-ink text-fg font-sans">{children}</body>
    </html>
  );
}
