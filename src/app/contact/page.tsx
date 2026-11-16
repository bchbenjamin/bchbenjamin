import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Benjamin about engineering, software and worthwhile collaborations."
};

export default async function ContactPage() {
  const site = await getSiteContent();
  return (
    <section className="shell inner-page contact-page">
      <div className="page-intro" data-reveal>
        <p className="eyebrow"><span className="eyebrow-line" /> CONTACT / OPEN CHANNEL</p>
        <h1>Good work starts<br /><span>with a conversation.</span></h1>
        <p>Have a project, an interesting technical problem or an idea worth exploring? Send a note.</p>
      </div>
      <div className="contact-panel" data-reveal>
        <div className="contact-panel-copy">
          <span className="eyebrow">THE SIMPLEST WAY IN</span>
          <a className="contact-email" href={"mailto:" + site.owner.email}>{site.owner.email}<span>↗</span></a>
          <p>I usually prefer a clear note with a little context: what you’re building, what you’re trying to solve and where I might fit in.</p>
        </div>
        <div className="contact-panel-links">
          <a href={site.owner.github} target="_blank" rel="noreferrer"><span>GITHUB</span><strong>Explore the code <i>↗</i></strong></a>
          <Link href="/projects"><span>PORTFOLIO</span><strong>Browse selected work <i>↗</i></strong></Link>
          <span className="contact-location"><span>LOCATION</span><strong>{site.owner.location}</strong></span>
        </div>
      </div>
    </section>
  );
}
