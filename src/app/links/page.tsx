import type { Metadata } from "next";
import { getSiteContent, site as staticSite } from "@/lib/content";
import Image from "next/image";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  alternates: { canonical: "/links" },
  openGraph: { url: "/links", title: "Profile Links", description: "All official profile, portfolio and contact links in one place." },
  twitter: { card: "summary_large_image", title: "Profile Links", description: "All official profile, portfolio and contact links in one place." },
  title: "Profile Links",
  description: "All official profile, portfolio and contact links in one place."
};

function favicon(url: string) {
  try { return `https://www.google.com/s2/favicons?sz=96&domain_url=${encodeURIComponent(new URL(url).origin)}`; }
  catch { return "/favicon.ico"; }
}

export default async function LinksPage({ searchParams }: { searchParams: Promise<{ embedded?: string }> }) {
  const [{ embedded }, site] = await Promise.all([searchParams, getSiteContent()]);
  const website = site.owner.website || staticSite.owner.website;
  const github = site.owner.github || staticSite.owner.github;
  const linkedin = site.owner.linkedin || staticSite.owner.linkedin;
  const email = site.owner.email || staticSite.owner.email;
  const candidates = [
    { label: "Portfolio", href: "https://www.bchbenjamin.in", detail: "Personal portfolio and selected work" },
    ...(website ? [{ label: "Website", href: website, detail: "Personal website" }] : []),
    ...(github ? [{ label: "GitHub", href: github, detail: "Code, repositories and engineering work" }] : []),
    ...(linkedin ? [{ label: "LinkedIn", href: linkedin, detail: "Professional profile" }] : []),
    ...(email ? [{ label: "Email", href: `mailto:${email}`, detail: email }] : [])
  ];
  const links = candidates.filter((item, index) => candidates.findIndex(other => other.href === item.href) === index);
  return <main className={`shell inner-page profile-links-page${embedded === "1" ? " profile-links-embedded" : ""}`}>
    <header className="page-intro" data-reveal>
      <p className="eyebrow"><span className="eyebrow-line" /> PROFILE / LINKS</p>
      <h1>Find me<br /><span>around the web.</span></h1>
      <p>Official profile, portfolio and contact destinations in one place.</p>
    </header>
    <section className="profile-links-list" aria-label="Profile links">
      {links.map(item => { const external = item.href.startsWith("http"); return <a className="profile-link-card" href={item.href} key={item.label} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
        <span className="profile-link-icon">{external && <Image src={favicon(item.href)} alt="" width={36} height={36} unoptimized/>}{!external && <span aria-hidden="true">@</span>}</span>
        <span className="profile-link-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
        <span className="profile-link-arrow" aria-hidden="true">↗</span>
      </a>; })}
    </section>
    <p className="profile-links-note">Maintained from the portfolio profile settings.</p>
  </main>;
}
