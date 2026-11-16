import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent } from "@/lib/content";
import ContactForm from "@/components/ContactForm";

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
      <div className="contact-form-shell" data-reveal>
        <div className="contact-form-heading"><div><span className="eyebrow">SEND A MESSAGE</span><h2>Tell me what you have in mind.</h2><p>Submissions are screened for spam and verified by email before they reach my inbox.</p></div><span className="contact-form-index">01 / 01</span></div>
        <ContactForm />
      </div>
      <div className="contact-alternatives"><span>Prefer email?</span><a href={`mailto:${site.owner.email}`}>{site.owner.email} ↗</a><Link href="/projects">Browse selected work ↗</Link></div>
    </section>
  );
}
