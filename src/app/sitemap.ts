import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo";
import { getSiteContent } from "@/lib/content";

export const dynamic="force-static";
export const revalidate=60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSiteContent();
  const { projects } = site;
  const baseUrl = SITE_ORIGIN;
  const pages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "monthly", priority: 1 },
    { url: baseUrl + "/about", changeFrequency: "monthly", priority: 0.9 },
    { url: baseUrl + "/projects", changeFrequency: "monthly", priority: 0.9 },
    { url: baseUrl + "/experience", changeFrequency: "monthly", priority: 0.7 },
    { url: baseUrl + "/contact", changeFrequency: "yearly", priority: 0.6 },
    { url: baseUrl + "/links", changeFrequency: "monthly", priority: 0.7 }
  ];
  return pages.concat(projects.map((project) => ({
    url: baseUrl + "/projects/" + project.slug,
    changeFrequency: "monthly" as const,
    priority: 0.8
  })));
}
