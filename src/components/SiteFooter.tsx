import Image from "next/image";
import Link from "next/link";
import CopyEmailButton from "@/components/CopyEmailButton";

export default function SiteFooter({ ownerName, github, linkedin, email }: { ownerName: string; github: string; linkedin: string; email: string }) {
  return (
    <footer className="site-footer">
      <div className="shell footer-main">
        <Link className="brand footer-brand" href="/">
          <Image className="brand-logo" src="/logo.svg" alt="" width={30} height={38} />
          <span className="brand-name">{ownerName || "Portfolio"}<span className="brand-dot">.</span></span>
        </Link>
        <p className="footer-note">Thoughtfully built. Constantly iterating.</p>
        <div className="footer-links">
          {github && <a href={github} target="_blank" rel="noreferrer">GitHub ↗</a>}
          {linkedin && <a href={linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
          {email && <><a href={"mailto:" + email}>Email ↗</a><CopyEmailButton email={email} /></>}
          <Link href="/projects">Selected work ↗</Link>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} {ownerName}</span>
        <span>Designed and built with care.</span>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  );
}
