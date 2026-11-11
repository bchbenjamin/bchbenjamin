import type { Metadata } from "next";

import { ExperienceEntry } from "@/components/experience-entry";
import { getPublicItemsByType } from "@/lib/content";

export const metadata: Metadata = {
  title: "Experience",
  description: "Roles, education and other work along the way.",
};

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
      {children}
    </h2>
  );
}

export default function ExperiencePage() {
  const roles = getPublicItemsByType("EXPERIENCE");
  const education = getPublicItemsByType("EDUCATION");
  const achievements = getPublicItemsByType("ACHIEVEMENT");

  return (
    <div className="py-16 sm:py-24">
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
          02 — History
        </p>
        <h1 className="mt-4 text-4xl font-medium tracking-[-0.025em] text-fg sm:text-5xl">
          Experience
        </h1>
        <p className="mt-5 text-[15px] leading-7 text-fg-muted">
          Where I have worked and what I owned there.
        </p>
      </header>

      <section className="mt-14 space-y-6">
        <Heading>Roles</Heading>
        {roles.map((item) => (
          <ExperienceEntry key={item.id} item={item} />
        ))}
      </section>

      {education.length > 0 ? (
        <section className="mt-16 space-y-6">
          <Heading>Education</Heading>
          {education.map((item) => (
            <ExperienceEntry key={item.id} item={item} />
          ))}
        </section>
      ) : null}

      {achievements.length > 0 ? (
        <section className="mt-16 space-y-6">
          <Heading>Other</Heading>
          {achievements.map((item) => (
            <ExperienceEntry key={item.id} item={item} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
