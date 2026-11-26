"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/about", label: "About" },
  { href: "/projects", label: "Work" },
  { href: "/experience", label: "Journey" }
];

export default function SiteHeader({ ownerName }: { ownerName: string }) {
  const pathname = usePathname();
  const [motionPaused, setMotionPaused] = useState(false);

  const toggleMotion = () => {
    const next = !motionPaused;
    if (next) document.documentElement.dataset.motionPaused = "true";
    else document.documentElement.removeAttribute("data-motion-paused");
    setMotionPaused(next);
    window.dispatchEvent(new CustomEvent("portfolio:motion", { detail: { paused: next } }));
  };

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label={`${ownerName || "Portfolio"} — home`}>
          <Image className="brand-logo" src="/logo.svg" alt="" width={30} height={38} priority />
          <span className="brand-name">{ownerName || "Portfolio"}<span className="brand-dot">.</span></span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => {
            const active = link.href.startsWith("/#") ? pathname === "/" : pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                className={active ? "nav-link nav-link-active" : "nav-link"}
                href={link.href}
                key={link.href}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          className="motion-toggle"
          type="button"
          onClick={toggleMotion}
          aria-label={motionPaused ? "Resume decorative motion" : "Pause decorative motion"}
          title={motionPaused ? "Resume motion" : "Pause motion"}
        >
          <span aria-hidden="true">{motionPaused ? "▶" : "Ⅱ"}</span>
        </button>

        <Link className="header-contact" href="/contact" aria-label={`Contact ${ownerName || "the owner"}`}>
          <span>Let’s talk</span>
          <span aria-hidden="true" className="arrow-up-right">↗</span>
        </Link>
      </div>
    </header>
  );
}
