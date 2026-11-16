"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/projects", label: "Work" },
  { href: "/experience", label: "Experience" },
  { href: "/resume", label: "Resume" }
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="Benjamin — home">
          <span className="brand-mark">BCH</span>
          <span className="brand-name">benjamin<span className="brand-dot">.</span></span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
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

        <Link className="header-contact" href="/contact">
          <span>Let’s talk</span>
          <span aria-hidden="true" className="arrow-up-right">↗</span>
        </Link>
      </div>
    </header>
  );
}
