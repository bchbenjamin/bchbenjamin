import type { Metadata } from "next";
import { getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Resume",
  description: "A concise overview of Benjamin's engineering focus, experience and selected work."
};

export default async function ResumePage() {
  const site = await getSiteContent();
  return (
    <section className="shell inner-page resume-page">
      <div className="page-intro" data-reveal>
        <p className="eyebrow"><span className="eyebrow-line" /> PROFILE / RESUME</p>
        <h1>A profile built<br /><span>around the work.</span></h1>
        <p>A concise snapshot of my background and the areas I’m actively developing.</p>
      </div>

      <div className="resume-sheet" data-reveal>
        <div className="resume-sheet-head">
          <div><p className="eyebrow">CURRICULUM VITAE / 2026</p><h2>{site.owner.name}</h2><p>{site.owner.role}</p></div>
          <a className="text-link" href={"mailto:" + site.owner.email}>Request current resume ↗</a>
        </div>
        <div className="resume-section">
          <h3>PROFILE</h3>
          <p>{site.owner.intro}</p>
        </div>
        <div className="resume-section">
          <h3>FOCUS AREAS</h3>
          <div className="skill-pills">
            {site.skillGroups.flatMap((group) => group.skills).map((skill) => <span key={skill}>{skill}</span>)}
          </div>
        </div>
        <div className="resume-section">
          <h3>SELECTED WORK</h3>
          {site.projects.map((project) => (
            <div className="resume-project" key={project.slug}>
              <div><strong>{project.name}</strong><span>{project.category}</span></div>
              <p>{project.summary}</p>
            </div>
          ))}
        </div>
        <div className="resume-section">
          <h3>EXPERIENCE</h3>
          {site.experience.map((entry) => (
            <div className="resume-project" key={entry.title}>
              <div><strong>{entry.title} · {entry.organization}</strong><span>{entry.period}</span></div>
              <p>{entry.description}</p>
            </div>
          ))}
        </div>
        <div className="resume-sheet-foot"><span>{site.owner.email}</span><span>{site.owner.website.replace("https://", "")}</span></div>
      </div>
      <p className="resume-note">The public download will be enabled when the ATS-first resume publishing workflow is implemented. This page currently displays the verified profile snapshot.</p>
    </section>
  );
}
