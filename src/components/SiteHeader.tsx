"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createLiquidGlass, supportsRefraction } from "@/lib/liquid-glass/liquid-glass";

const links = [
  { href: "/#about", label: "About" },
  { href: "/projects", label: "Work" },
  { href: "/experience", label: "Journey" }
];

export default function SiteHeader() {
  const pathname = usePathname();
  const glassRef = useRef<HTMLDivElement>(null);
  const [motionPaused, setMotionPaused] = useState(false);

  useEffect(() => {
    const host = glassRef.current;
    if (!host) return;
    host.dataset.liquidGlass = supportsRefraction ? "refractive" : "frosted-fallback";
    const glass = createLiquidGlass(host, { radius: 30, rim: 1.15, blur: 1.8, saturate: 1.28, reflect: false, reflectStrength: 1.4, promote: false });
    return () => glass.destroy();
  }, []);

  const toggleMotion = () => {
    const next = !motionPaused;
    if (next) document.documentElement.dataset.motionPaused = "true";
    else document.documentElement.removeAttribute("data-motion-paused");
    setMotionPaused(next);
    window.dispatchEvent(new CustomEvent("portfolio:motion", { detail: { paused: next } }));
  };

  return (
    <header className="site-header">
      <div ref={glassRef} className="shell header-inner" data-lg-dark>
        <Link className="brand" href="/" aria-label="B C H Benjamin — home">
          <span className="brand-mark">BCH</span>
          <span className="brand-name">benjamin<span className="brand-dot">.</span></span>
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

        <Link className="header-contact" href="/contact" aria-label="Contact B C H Benjamin">
          <span>Let’s talk</span>
          <span aria-hidden="true" className="arrow-up-right">↗</span>
        </Link>
      </div>
    </header>
  );
}
