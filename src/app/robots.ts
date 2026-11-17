import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/api/v1/admin", "/api/v1/agent", "/mcp"]
    },
    sitemap: "https://bchbenjamin.in/sitemap.xml"
  };
}
