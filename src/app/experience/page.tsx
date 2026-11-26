import type { Metadata } from "next";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import Surface from "@/components/Surface";
import { getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  alternates: { canonical: "/experience" },
  openGraph: { url: "/experience", title: "Experience", description: "Professional experience, education, milestones and selected engineering work." },
  twitter: { card: "summary_large_image", title: "Experience", description: "Professional experience, education, milestones and selected engineering work." },
  title: "Experience",
  description: "Professional experience, education, milestones and selected engineering work."
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
          <article className="timeline-entry" key={entry.title + entry.organization}>
            <div className="timeline-marker"><span>0{index + 1}</span><i /></div>
            <Surface className="timeline-content" as="div">
              <p className="eyebrow">{entry.label}</p>
              <h2>{entry.title}</h2>
              <div className="timeline-meta"><strong>{entry.organization}</strong><span>{entry.period}</span></div>
              <p>{entry.description}</p>
              {entry.repo && <a className="text-link" href={entry.repo} target="_blank" rel="noreferrer">View related source ↗</a>}
            </Surface>
          </article>
        ))}
      </div>

      <SectionHeading eyebrow="EDUCATION / 02" title="Where I’ve studied." />
      <div className="timeline education-timeline">
        {site.education.map((entry, index) => (
          <article className="timeline-entry" key={entry.qualification + entry.institution}>
            <div className="timeline-marker"><span>0{index + 1}</span><i /></div>
            <Surface className="timeline-content" as="div">
              <p className="eyebrow">{entry.period}</p>
              <h2>{entry.qualification}</h2>
              <div className="timeline-meta"><strong>{entry.institution}</strong>{entry.fieldOfStudy && <span>{entry.fieldOfStudy}</span>}</div>
              {entry.grade && <p>Grade: {entry.grade}</p>}{entry.description && <p>{entry.description}</p>}
            </Surface>
          </article>
        ))}
      </div>

      <SectionHeading eyebrow="MILESTONES / 03" title="A few things worth noting." />
      <div className="achievement-grid">
        {site.achievements.map((item, index) => (
          <Surface as="article" className="achievement-card" key={item.title}>
            <span className="achievement-index">0{index + 1} / {item.label}{item.issuer ? " · " + item.issuer : ""}{item.issuedLabel ? " · " + item.issuedLabel : ""}</span>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </Surface>
        ))}
      </div>

      <div className="experience-bottom" data-reveal>
        <p>There’s more to build and more to learn.</p>
        <Link className="text-link" href="/projects">See what I’m working on ↗</Link>
      </div>
    </section>
  );
}
