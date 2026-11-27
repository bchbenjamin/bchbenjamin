import type { Metadata } from "next";
import type { SiteContent, Project } from "./content";

export const SITE_ORIGIN = "https://www.bchbenjamin.in";
export const canonical = (path = "/") => new URL(path, SITE_ORIGIN).href;
export function summary(value: string, limit = 155) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  const shortened = clean.slice(0, limit - 1);
  return (shortened.lastIndexOf(" ") > limit * .65 ? shortened.slice(0, shortened.lastIndexOf(" ")) : shortened) + "…";
}
export function shareImage(site: SiteContent) {
  // A deterministic version lets crawlers distinguish edited profile cards.
  const input = JSON.stringify([site.owner.name,site.owner.headline,site.owner.intro,site.owner.photoUrl]);
  let hash=2166136261;
  for(let i=0;i<input.length;i++) hash=Math.imul(hash^input.charCodeAt(i),16777619);
  return canonical("/share-image?v="+(hash>>>0).toString(36));
}
export function pageSeo(site: SiteContent, path: string, title: string, description: string): Metadata {
  const name = site.owner.name || "Portfolio";
  const fullTitle = path === "/" ? title : title + " — " + name;
  const text = summary(description || "Explore public engineering projects and portfolio experience.");
  const social = summary(description || text, 300);
  const image = shareImage(site);
  return { title, description: text, alternates: { canonical: canonical(path) },
    openGraph: { type: "website", url: canonical(path), siteName: name + " — Portfolio", title: fullTitle, description: social, images: [{url:image,width:1200,height:630,alt:name+" — Portfolio"}] },
    twitter: { card: "summary_large_image", title: fullTitle, description: social, images: [image] } };
}
function publicUrl(value?: string) {
  try { const url = new URL(value || ""); return url.protocol === "https:" ? url.href : undefined; } catch { return undefined; }
}
export function projectSchema(project: Project, site: SiteContent) {
  return { "@type": "CreativeWork", "@id": canonical("/projects/" + project.slug) + "#project", url: canonical("/projects/" + project.slug),
    name: project.name, description: project.summary || project.description, keywords: project.stack.join(", "),
    ...(site.owner.name ? { creator: { "@id": canonical() + "#person" } } : {}),
    ...(publicUrl(project.imageUrl) ? { image: publicUrl(project.imageUrl) } : {}),
    ...(publicUrl(project.repo) ? { sameAs: publicUrl(project.repo) } : {}) };
}
export function portfolioSchema(site: SiteContent) {
  const person = { "@type": "Person", "@id": canonical() + "#person", name: site.owner.name, url: canonical(),
    description: site.owner.intro || site.owner.headline,
    ...(site.owner.photoUrl ? { image: canonical(site.owner.photoUrl) } : {}),
    ...(site.owner.headline ? { jobTitle: site.owner.headline } : {}),
    sameAs: [publicUrl(site.owner.github), publicUrl(site.owner.linkedin)].filter(Boolean),
    knowsAbout: [...new Set(site.skillGroups.flatMap(group => group.skills))] };
  return { "@context": "https://schema.org", "@graph": [
    ...(site.owner.name ? [person] : []),
    { "@type": "WebSite", "@id": canonical() + "#website", url: canonical(), name: (site.owner.name || "Personal") + " Portfolio", ...(site.owner.name ? { publisher: { "@id": person["@id"] } } : {}) },
    { "@type": site.owner.name ? "ProfilePage" : "WebPage", "@id": canonical() + "#page", url: canonical(), ...(site.owner.name ? { mainEntity: { "@id": person["@id"] } } : {}) }
  ] };
}
export function serializeJsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }
