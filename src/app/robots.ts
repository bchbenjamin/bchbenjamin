import type { MetadataRoute } from "next";
import { getSiteContent } from "@/lib/content";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSiteContent();
  let baseUrl = "https://bchbenjamin.in";
  try { baseUrl = new URL(site.owner.website || baseUrl).origin; } catch { /* Retain the configured canonical deployment domain. */ }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/api/v1/admin", "/api/v1/agent", "/mcp"]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
