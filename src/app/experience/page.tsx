import type { Metadata } from "next";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import { getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Experience",
  description: "Experience, milestones and interests from Benjamin's engineering journey."
};

export const dynamic = "force-dynamic";

export default async function ExperiencePage() {
  const site = await getSiteContent();
  return (
    <section className="shell inner-page">
      <div className="page-intro" data-reveal>
        <p className="eyebrow"><span className="eyebrow-line" /> BACKGROUND / EXPERIENCE</p>
        <h1>Learning by<br /><span>building things.</span></h1>
        <p>Selected experience, education and technical work, based on the details in my current résumé.</p>
      </div>

      <SectionHeading eyebrow="EXPERIENCE / 01" title="Where I’ve spent time." />
      <div className="timeline">
        {site.experience.map((entry, index) => (
          <article className="timeline-entry" key={entry.title + entry.organization} data-reveal>
            <div className="timeline-marker"><span>0{index + 1}</span><i /></div>
            <div className="timeline-content">
              <p className="eyebrow">{entry.label}</p>
              <h2>{entry.title}</h2>
              <div className="timeline-meta"><strong>{entry.organization}</strong><span>{entry.period}</span></div>
              <p>{entry.description}</p>
              {entry.repo && <a className="text-link" href={entry.repo} target="_blank" rel="noreferrer">View related source ↗</a>}
            </div>
          </article>
        ))}
      </div>

      <SectionHeading eyebrow="EDUCATION / 02" title="Where I’ve studied." />
      <div className="timeline education-timeline">
        {site.education.map((entry, index) => (
          <article className="timeline-entry" key={entry.qualification + entry.institution} data-reveal>
            <div className="timeline-marker"><span>0{index + 1}</span><i /></div>
            <div className="timeline-content">
              <p className="eyebrow">{entry.period}</p>
              <h2>{entry.qualification}</h2>
              <div className="timeline-meta"><strong>{entry.institution}</strong>{entry.fieldOfStudy && <span>{entry.fieldOfStudy}</span>}</div>
              {entry.description && <p>{entry.description}</p>}
            </div>
          </article>
        ))}
      </div>

      <SectionHeading eyebrow="MILESTONES / 03" title="A few things worth noting." />
      <div className="achievement-grid">
        {site.achievements.map((item, index) => (
          <article className="achievement-card" key={item.title} data-reveal>
            <span className="achievement-index">0{index + 1} / {item.label}</span>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>

      <div className="experience-bottom" data-reveal>
        <p>There’s more to build and more to learn.</p>
        <Link className="text-link" href="/projects">See what I’m working on ↗</Link>
      </div>
    </section>
  );
}
