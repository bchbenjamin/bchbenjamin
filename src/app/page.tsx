import type { ReactNode } from "react";
import Link from "next/link";
import WaveDivider from "@/components/WaveDivider";
import ProjectArtwork from "@/components/ProjectArtwork";
import SectionHeading from "@/components/SectionHeading";
import ContactForm from "@/components/ContactForm";
import AchievementGallery from "@/components/AchievementGallery";
import SaveProjectButton from "@/components/SaveProjectButton";
import HomeImageGallery from "@/components/HomeImageGallery";
import { getSiteContent } from "@/lib/content";

function Arrow() { return <span aria-hidden="true" className="arrow-up-right">↗</span>; }

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const site = await getSiteContent();
  const featuredProjects = site.projects.filter((project) => project.featured);

  const sections: Record<string, ReactNode> = {
    "image-gallery": <HomeImageGallery projects={site.projects} />,
    hero: <section className="shell hero-section" id="top">
      <div className="hero-copy">
        <p className="eyebrow"><span className="status-pulse" /> {site.homeContent.heroEyebrow}</p>
        <h1>{site.owner.headline}</h1>
        <p className="hero-intro">{site.owner.intro}</p>
        <div className="hero-actions"><Link className="button button-primary" href="/projects">Explore selected work <Arrow /></Link><Link className="button button-quiet" href="/contact">Get in touch <Arrow /></Link></div>
        <div className="hero-meta"><div><span className="meta-label">FOCUS</span><strong>{site.homeContent.focus}</strong></div><div><span className="meta-label">BASED IN</span><strong>{site.owner.location}</strong></div></div>
      </div>
      <div className="hero-art" data-parallax aria-label="Abstract visual representing software systems"><div className="hero-art-frame" data-pointer-tilt><div className="hero-art-top"><span>FIELD NOTES / 001</span><span>BUILDING IN PUBLIC</span></div><div className="hero-blueprint" aria-hidden="true"><span className="blueprint-orbit blueprint-orbit-one" /><span className="blueprint-orbit blueprint-orbit-two" /><span className="blueprint-route blueprint-route-one" /><span className="blueprint-route blueprint-route-two" /><span className="blueprint-node blueprint-node-one" /><span className="blueprint-node blueprint-node-two" /><span className="blueprint-node blueprint-node-three" /><div className="blueprint-card blueprint-card-one"><small>01 / INTELLIGENCE</small><strong>Applied AI</strong><i>Models · Signals · Decisions</i></div><div className="blueprint-card blueprint-card-two"><small>02 / ENGINEERING</small><strong>Useful systems</strong><i>Design · Build · Iterate</i></div><div className="hero-core"><span>{site.owner.monogram || "BCH"}</span><i /></div></div><div className="hero-art-bottom"><span className="art-caption">IDEAS → SYSTEMS → SOFTWARE</span><span className="art-coordinate">01 / 04</span></div></div><div className="hero-side-note"><span>01</span><span>Curiosity<br />into craft</span></div></div>
      <div className="hero-scroll-cue"><span>SCROLL TO EXPLORE</span><i /></div>
    </section>,
    principles: <div className="shell principles-strip" data-reveal><span>THINK IN SYSTEMS</span><i /><span>BUILD WITH INTENT</span><i /><span>SHIP, LEARN, ITERATE</span><i /><span>KEEP IT USEFUL</span></div>,
    "achievement-gallery": <AchievementGallery achievements={site.achievements} />,
    projects: <section className="shell section-block work-section" id="work"><SectionHeading eyebrow="SELECTED WORK / 02" title={site.homeContent.projectsTitle} description={site.homeContent.projectsDescription} action={<Link className="text-link" href="/projects">All projects <Arrow /></Link>} /><div className="project-grid" data-animate-stagger>{featuredProjects.map((project, index) => <article className={"project-card project-card-" + project.visual} key={project.slug} data-reveal><Link className="project-card-link" href={"/projects/" + project.slug} aria-label={"View " + project.name + " project"}><ProjectArtwork project={project} /><div className="project-card-content"><div className="project-card-topline"><span>{project.category}</span><span>0{index + 1}</span></div><div className="project-card-title-row"><h3>{project.name}</h3><span className="card-arrow"><Arrow /></span></div><p>{project.summary}</p><div className="project-card-bottom"><span className="status-label"><i />{project.status}</span><span className="project-stack">{project.stack.slice(0, 2).join(" · ")}</span></div></div></Link><SaveProjectButton slug={project.slug} name={project.name} /></article>)}</div></section>,
    about: <section className="about-band" id="about"><WaveDivider /><div className="shell about-grid"><div className="about-heading" data-reveal><p className="eyebrow"><span className="eyebrow-line" /> A LITTLE ABOUT ME / 02</p><h2>{site.homeContent.aboutTitle.split("\n").map((line, i) => <span key={line}>{i > 0 && <br />}{i === 0 ? line : <em>{line}</em>}</span>)}</h2></div><div className="about-copy" data-reveal>{site.homeContent.aboutParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<Link className="text-link" href="/experience">More about my journey <Arrow /></Link></div></div></section>,
    skills: <section className="shell section-block capability-section" id="skills"><SectionHeading eyebrow="TOOLS & INTERESTS / 03" title={site.homeContent.skillsTitle} description={site.homeContent.skillsDescription} /><div className="skill-grid" data-animate-stagger>{site.skillGroups.map((group, index) => <div className="skill-group" key={group.name} data-reveal><div className="skill-group-head"><span>0{index + 1}</span><h3>{group.name}</h3></div><div className="skill-pills">{group.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>)}</div></section>,
    contact: <><section className="shell contact-callout" data-reveal><div><p className="eyebrow"><span className="eyebrow-line" /> OPEN CHANNEL / 04</p><h2>{site.homeContent.contactTitle}</h2><p>{site.homeContent.contactDescription}</p></div><Link className="button button-primary" href="#contact-form">Start a conversation <Arrow /></Link><span className="callout-watermark">BCH</span></section><section className="shell home-contact-form" id="contact-form" data-reveal><div className="home-contact-heading"><p className="eyebrow"><span className="eyebrow-line" /> SEND A NOTE / 05</p><h2>Tell me what you’re<br /><span>thinking about.</span></h2><p>Share a little context. Verified, approved enquiries reach my inbox directly.</p></div><ContactForm /></section></>
  };
  const order = [...site.homeSections].filter((section) => section.enabled).sort((a, b) => a.order - b.order);

  return <>{order.map((section) => <div key={section.id} className="home-section-slot">{sections[section.id] ?? null}</div>)}</>;
}
