import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectArtwork from "@/components/ProjectArtwork";
import ProjectMediaGallery from "@/components/ProjectMediaGallery";
import Surface from "@/components/Surface";
import { getPublicProjectBySlug } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);
  if (!project) return {};
  return {
    title: project.name,
    description: project.summary,
    openGraph: { title: project.name + " — Benjamin", description: project.summary }
  };
}

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);
  if (!project) notFound();

  return (
    <article className="shell inner-page project-detail">
      <Link className="back-link" href="/projects">← Back to projects</Link>
      <div className="detail-heading" data-reveal>
        <p className="eyebrow"><span className="eyebrow-line" />{project.category}</p>
        <div className="detail-title-row"><h1>{project.name}<span>.</span></h1><span className="status-label"><i />{project.status}</span></div>
        <p className="detail-summary">{project.summary}</p>
      </div>
      {project.period && <p className="project-period-label">{project.period}</p>}
      <ProjectArtwork project={project} priority />
      <ProjectMediaGallery media={project.media ?? []} />
      <div className="detail-content-grid">
        <div className="detail-overview" data-reveal>
          <p className="eyebrow">OVERVIEW / THE WHY</p>
          <h2>What it is<br /><span>and why it matters.</span></h2>
          <p>{project.description}</p>
        </div>
        <Surface as="aside" className="detail-facts">
          {project.role && <div><span>MY ROLE</span><strong>{project.role}</strong></div>}
          <div><span>TECHNOLOGY</span><div className="skill-pills">{project.stack.map((item) => <span key={item}>{item}</span>)}</div></div>
          {project.repo && <a className="text-link" href={project.repo} target="_blank" rel="noreferrer">Explore repository ↗</a>}
          {project.liveUrl && <a className="text-link" href={project.liveUrl} target="_blank" rel="noreferrer">Open live demo ↗</a>}
        </Surface>
      </div>
      <div className="detail-next"><span>KEEP EXPLORING</span><Link className="text-link" href="/projects">More projects ↗</Link></div>
    </article>
  );
}
