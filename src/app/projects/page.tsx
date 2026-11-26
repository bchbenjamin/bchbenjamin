import JsonLd from "@/components/JsonLd";
import {canonical} from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import ProjectArtwork from "@/components/ProjectArtwork";
import SectionHeading from "@/components/SectionHeading";
import { getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  alternates: { canonical: "/projects" },
  openGraph: { url: "/projects", title: "Projects", description: "Selected software, AI, data and edge-computing projects." },
  twitter: { card: "summary_large_image", title: "Projects", description: "Selected software, AI, data and edge-computing projects." },
  title: "Projects",
  description: "Selected software, AI, data and edge-computing projects."
};

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { projects } = await getSiteContent();
  return (
    <section className="shell inner-page">
      <JsonLd data={{"@context":"https://schema.org","@type":"ItemList",itemListElement:projects.map((project,index)=>({"@type":"ListItem",position:index+1,url:canonical("/projects/"+project.slug),name:project.name}))}} />
      <div className="page-intro" data-reveal>
        <p className="eyebrow"><span className="eyebrow-line" /> WORK / SELECTED PROJECTS</p>
        <h1>Built to solve.<br /><span>Made to be useful.</span></h1>
        <p>A selection of independent builds, academic work and systems in progress. Each project is a chance to turn an interesting problem into something concrete.</p>
      </div>

      <SectionHeading eyebrow="PROJECT INDEX" title="The workbench." description="Explore the thinking, the constraints and the build behind each project." />
      <div className="project-grid project-grid-page">
        {projects.map((project, index) => (
          <article className={"project-card project-card-" + project.visual} key={project.slug} data-reveal>
            <Link className="project-card-link" href={"/projects/" + project.slug}>
              <ProjectArtwork project={project} />
              <div className="project-card-content">
                <div className="project-card-topline"><span>{project.category}</span><span>0{index + 1}</span></div>
                <div className="project-card-title-row"><h3>{project.name}</h3><span className="card-arrow">↗</span></div>
                <p>{project.summary}</p>
                <div className="project-card-bottom"><span className="status-label"><i />{project.status}</span><span className="project-stack">{project.stack.slice(0, 2).join(" · ")}</span></div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
