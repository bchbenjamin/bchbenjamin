import Link from "next/link";

export default function NotFound() {
  return (
    <section className="shell inner-page not-found" id="top">
      <p className="eyebrow"><span className="eyebrow-line" /> 404 / WRONG TURN</p>
      <h1>This page<br /><span>isn’t here.</span></h1>
      <p>The link may be outdated, or the page may have moved.</p>
      <Link className="button button-primary" href="/">Return home ↗</Link>
    </section>
  );
}
