import type { Metadata } from "next";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Experience",
  description: "Experience, milestones and interests from Benjamin's engineering journey."
};

export default function ExperiencePage() {
  return (
    <section className="shell inner-page">
      <div className="page-intro" data-reveal>
        <p className="eyebrow"><span className="eyebrow-line" /> BACKGROUND / EXPERIENCE</p>
        <h1>Learning by<br /><span>building things.</span></h1>
        <p>My journey is shaped by coursework, internships, independent projects and the habit of going deeper than the first working solution.</p>
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
            </div>
          </article>
        ))}
      </div>

      <SectionHeading eyebrow="MILESTONES / 02" title="A few things worth noting." />
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
