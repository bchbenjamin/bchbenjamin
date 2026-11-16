import Link from "next/link";
import HeroShaderLoader from "@/components/HeroShaderLoader";
import WaveDivider from "@/components/WaveDivider";
import ProjectVisual from "@/components/ProjectVisual";
import SectionHeading from "@/components/SectionHeading";
import ContactForm from "@/components/ContactForm";
import { getSiteContent } from "@/lib/content";

function Arrow() {
  return <span aria-hidden="true" className="arrow-up-right">↗</span>;
}

export default async function HomePage() {
  const site = await getSiteContent();
  const featuredProjects = site.projects.filter((project) => project.featured);
  return (
    <>
      <section className="shell hero-section" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-pulse" /> INDEPENDENT BUILDER <span className="eyebrow-separator">/</span> SOFTWARE & SYSTEMS</p>
          <h1>I build useful software for <span className="headline-accent">complex, real-world problems.</span></h1>
          <p className="hero-intro">{site.owner.intro}</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/projects">Explore selected work <Arrow /></Link>
            <Link className="button button-quiet" href="/contact">Get in touch <Arrow /></Link>
          </div>
          <div className="hero-meta">
            <div><span className="meta-label">FOCUS</span><strong>AI · Data · Edge · Web</strong></div>
            <div><span className="meta-label">BASED IN</span><strong>{site.owner.location}</strong></div>
          </div>
        </div>

        <div className="hero-art" aria-label="Abstract visual representing software systems">
          <div className="hero-art-frame">
            <HeroShaderLoader />
            <div className="hero-art-top"><span>FIELD NOTES / 001</span><span>BUILDING IN PUBLIC</span></div>
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-core"><span>BCH</span><i /></div>
            <div className="hero-art-bottom">
              <span className="art-caption">IDEAS → SYSTEMS → SOFTWARE</span>
              <span className="art-coordinate">01 / 04</span>
            </div>
          </div>
          <div className="hero-side-note"><span>01</span><span>Curiosity<br />into craft</span></div>
        </div>
      </section>

      <div className="shell principles-strip" data-reveal>
        <span>THINK IN SYSTEMS</span><i />
        <span>BUILD WITH INTENT</span><i />
        <span>SHIP, LEARN, ITERATE</span><i />
        <span>KEEP IT USEFUL</span>
      </div>

      <section className="shell section-block work-section" id="work">
        <SectionHeading
          eyebrow="SELECTED WORK / 01"
          title="Projects with a purpose."
          description="A snapshot of things I’m building, exploring and learning from."
          action={<Link className="text-link" href="/projects">All projects <Arrow /></Link>}
        />
        <div className="project-grid">
          {featuredProjects.map((project, index) => (
            <article className={"project-card project-card-" + project.visual} key={project.slug} data-reveal>
              <Link className="project-card-link" href={"/projects/" + project.slug} aria-label={"View " + project.name + " project"}>
                <ProjectVisual variant={project.visual} name={project.name} />
                <div className="project-card-content">
                  <div className="project-card-topline"><span>{project.category}</span><span>0{index + 1}</span></div>
                  <div className="project-card-title-row">
                    <h3>{project.name}</h3>
                    <span className="card-arrow"><Arrow /></span>
                  </div>
                  <p>{project.summary}</p>
                  <div className="project-card-bottom">
                    <span className="status-label"><i />{project.status}</span>
                    <span className="project-stack">{project.stack.slice(0, 2).join(" · ")}</span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="about-band">
        <WaveDivider />
        <div className="shell about-grid">
          <div className="about-heading" data-reveal>
            <p className="eyebrow"><span className="eyebrow-line" /> A LITTLE ABOUT ME / 02</p>
            <h2>Curious by default.<br /><span>Practical by design.</span></h2>
          </div>
          <div className="about-copy" data-reveal>
            <p>I enjoy working where software meets the physical world: an application that people can rely on, a model that runs within a real hardware budget, or a data pipeline that turns messy inputs into something useful.</p>
            <p>I care about the details behind the interface too — architecture, performance, maintainability and the trade-offs that make a product dependable.</p>
            <Link className="text-link" href="/experience">More about my journey <Arrow /></Link>
          </div>
        </div>
      </section>

      <section className="shell section-block capability-section">
        <SectionHeading
          eyebrow="TOOLS & INTERESTS / 03"
          title="A toolkit that keeps evolving."
          description="I choose tools around the problem, not the other way around."
        />
        <div className="skill-grid">
          {site.skillGroups.map((group, index) => (
            <div className="skill-group" key={group.name} data-reveal>
              <div className="skill-group-head"><span>0{index + 1}</span><h3>{group.name}</h3></div>
              <div className="skill-pills">
                {group.skills.map((skill) => <span key={skill}>{skill}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="shell contact-callout" data-reveal>
        <div>
          <p className="eyebrow"><span className="eyebrow-line" /> OPEN CHANNEL / 04</p>
          <h2>Have a thoughtful problem<br />worth solving?</h2>
          <p>I’m always interested in good engineering conversations and worthwhile collaborations.</p>
        </div>
        <Link className="button button-primary" href="#contact-form">Start a conversation <Arrow /></Link>
        <span className="callout-watermark">BCH</span>
      </section>
      <section className="shell home-contact-form" id="contact-form" data-reveal>
        <div className="home-contact-heading"><p className="eyebrow"><span className="eyebrow-line" /> SEND A NOTE / 05</p><h2>Tell me what you’re<br /><span>thinking about.</span></h2><p>Share a little context. Verified, approved enquiries reach my inbox directly.</p></div>
        <ContactForm />
      </section>
    </>
  );
}
