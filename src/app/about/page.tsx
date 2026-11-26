import Link from "next/link";
import {getSiteContent} from "@/lib/content";
import {pageSeo} from "@/lib/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const site=await getSiteContent(); return pageSeo(site,"/about","About",site.owner.intro || site.owner.headline); }
export default async function AboutPage() {
  const site=await getSiteContent();
  return <section className="shell inner-page">
    <header className="page-intro"><p className="eyebrow">PORTFOLIO / ABOUT</p><h1>{site.owner.name || "About the portfolio"}</h1><p>{site.owner.headline}</p><p>{site.owner.intro}</p></header>
    {site.skillGroups.length>0 && <section><h2>Technical skills</h2>{site.skillGroups.map(group=><article key={group.name}><h3>{group.name}</h3><div className="skill-pills">{group.skills.map(skill=><span key={skill}>{skill}</span>)}</div></article>)}</section>}
    {site.projects.length>0 && <section className="detail-next"><h2>Explore my work</h2><ul>{site.projects.map(project=><li key={project.slug}><Link href={"/projects/"+project.slug}>{project.name}</Link> — {project.summary}</li>)}</ul></section>}
    <nav className="detail-next" aria-label="Explore the portfolio"><Link href="/experience">Experience and achievements</Link> · <Link href="/projects">All projects</Link> · <Link href="/contact">Contact</Link> · <Link href="/">Phone experience</Link></nav>
  </section>;
}
