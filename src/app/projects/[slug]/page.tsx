import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectVisual from "@/components/ProjectVisual";
import { getProjectBySlug, getLiveProjectBySlug, projects } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getLiveProjectBySlug(slug) ?? getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: project.name,
    description: project.summary,
    openGraph: { title: project.name + " — Benjamin", description: project.summary }
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getLiveProjectBySlug(slug) ?? getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <article className="shell inner-page project-detail">
      <Link className="back-link" href="/projects">← Back to projects</Link>
      <div className="detail-heading" data-reveal>
        <p className="eyebrow"><span className="eyebrow-line" />{project.category}</p>
        <div className="detail-title-row"><h1>{project.name}<span>.</span></h1><span className="status-label"><i />{project.status}</span></div>
        <p className="detail-summary">{project.summary}</p>
      </div>
      <ProjectVisual variant={project.visual} name={project.name} />
      <div className="detail-content-grid">
        <div className="detail-overview" data-reveal>
          <p className="eyebrow">OVERVIEW / THE WHY</p>
          <h2>What it is<br /><span>and why it matters.</span></h2>
          <p>{project.description}</p>
        </div>
        <aside className="detail-facts" data-reveal>
          <div><span>MY ROLE</span><strong>{project.role}</strong></div>
          <div><span>TECHNOLOGY</span><div className="skill-pills">{project.stack.map((item) => <span key={item}>{item}</span>)}</div></div>
          {project.repo && <a className="text-link" href={project.repo} target="_blank" rel="noreferrer">Explore repository ↗</a>}
        </aside>
      </div>
      <div className="detail-next"><span>KEEP EXPLORING</span><Link className="text-link" href="/projects">More projects ↗</Link></div>
    </article>
  );
}
