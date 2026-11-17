import Link from "next/link";
import CopyEmailButton from "@/components/CopyEmailButton";
import { site } from "@/lib/content";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-main">
        <Link className="brand footer-brand" href="/">
          <span className="brand-mark">BCH</span>
          <span className="brand-name">benjamin<span className="brand-dot">.</span></span>
        </Link>
        <p className="footer-note">Thoughtfully built. Constantly iterating.</p>
        <div className="footer-links">
          <a href={site.owner.github} target="_blank" rel="noreferrer">GitHub ↗</a>
          <a href={"mailto:" + site.owner.email}>Email ↗</a>
          <CopyEmailButton email={site.owner.email} />
          <Link href="/projects">Selected work ↗</Link>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} Benjamin</span>
        <span>Designed and built with care.</span>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  );
}
