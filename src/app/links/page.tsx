import type { Metadata } from "next";
import { getSiteContent } from "@/lib/content";
import Image from "next/image";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Profile Links",
  description: "All official profile, portfolio and contact links in one place."
};

function favicon(url: string) {
  try { return `https://www.google.com/s2/favicons?sz=96&domain_url=${encodeURIComponent(new URL(url).origin)}`; }
  catch { return "/favicon.ico"; }
}

export default async function LinksPage() {
  const site = await getSiteContent();
  const candidates = [
    { label: "Portfolio", href: "https://www.bchbenjamin.in", detail: "Personal portfolio and selected work" },
    ...(site.owner.website ? [{ label: "Website", href: site.owner.website, detail: "Personal website" }] : []),
    ...(site.owner.github ? [{ label: "GitHub", href: site.owner.github, detail: "Code, repositories and engineering work" }] : []),
    ...(site.owner.linkedin ? [{ label: "LinkedIn", href: site.owner.linkedin, detail: "Professional profile" }] : []),
    ...(site.owner.email ? [{ label: "Email", href: `mailto:${site.owner.email}`, detail: site.owner.email }] : [])
  ];
  const links = candidates.filter((item, index) => candidates.findIndex(other => other.href === item.href) === index);
  return <main className="shell inner-page profile-links-page">
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
