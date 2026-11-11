import type { Metadata } from "next";

import { profile } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to get in touch with Benjamin.",
};

export default function ContactPage() {
  return (
    <div className="py-16 sm:py-24">
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
          03 — Contact
        </p>
        <h1 className="mt-4 text-4xl font-medium tracking-[-0.025em] text-fg sm:text-5xl">
          Contact
        </h1>
        <p className="mt-5 text-[15px] leading-7 text-fg-muted">
          Email is the reliable way to reach me. I read everything and reply to
          anything that is not a bulk pitch.
        </p>
      </header>

      <div className="mt-12 max-w-2xl border-t border-line/60 pt-8">
        <a
          href={`mailto:${profile.email}`}
          className="border-b border-accent pb-1 text-xl text-fg transition-colors hover:text-accent sm:text-2xl"
        >
          {profile.email}
        </a>

        <ul className="mt-10 space-y-3">
          {profile.links.map((link) => (
            <li key={link.url} className="flex flex-wrap items-baseline gap-3">
              <span className="w-24 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-faint">
                {link.label}
              </span>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="break-all text-sm text-accent underline underline-offset-4 decoration-accent/40 transition-colors hover:decoration-accent"
              >
                {link.url}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
