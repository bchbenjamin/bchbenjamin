import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/api/v1/admin", "/api/v1/agent", "/mcp"]
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`
  };
}
