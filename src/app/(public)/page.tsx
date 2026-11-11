import Link from "next/link";

import { ExperienceEntry } from "@/components/experience-entry";
import { ProjectCard } from "@/components/project-card";
import { Section } from "@/components/section";
import { WaveDivider } from "@/components/wave-divider";
import {
  getFeaturedProjects,
  getPublicItemsByType,
  getSkillsByCategory,
  profile,
} from "@/lib/content";

const linkUnderline =
  "border-b border-accent pb-1 text-sm text-fg transition-colors hover:text-accent";

export default function HomePage() {
  const year = new Date().getFullYear();
  const projects = getFeaturedProjects(2);
  const experience = getPublicItemsByType("EXPERIENCE").slice(0, 2);
  const skillGroups = getSkillsByCategory();

  return (
    <div className="pb-20">
      <section className="pt-20 pb-8 sm:pt-28">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-faint">
          Portfolio — {year}
        </p>
        <h1 className="mt-6 text-[clamp(2.75rem,9vw,6rem)] font-medium leading-[0.95] tracking-[-0.035em] text-fg">
          {profile.name}
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-fg-muted sm:text-xl">
          {profile.headline}
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-fg-faint">
          {profile.summary}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link href="/projects" className={linkUnderline}>
            Selected work
          </Link>
          <Link
            href="/experience"
            className="border-b border-line pb-1 text-sm text-fg-muted transition-colors hover:border-line hover:text-fg"
          >
            Experience
          </Link>
          <a
            href={`mailto:${profile.email}`}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-faint transition-colors hover:text-fg"
          >
            {profile.email}
          </a>
        </div>
      </section>

      <WaveDivider />

      <Section
        index="01"
        title="Selected work"
        intro="A few projects that show how I think about data, failure and interfaces."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {projects.map((item, index) => (
            <ProjectCard key={item.id} item={item} index={index + 1} />
          ))}
        </div>
        <Link
          href="/projects"
          className="inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-fg-muted transition-colors hover:text-accent"
        >
          All projects
        </Link>
      </Section>

      <Section index="02" title="Experience">
        <div className="space-y-6">
          {experience.map((item) => (
            <ExperienceEntry key={item.id} item={item} showBullets={false} />
          ))}
        </div>
        <Link
          href="/experience"
          className="inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-fg-muted transition-colors hover:text-accent"
        >
          Full experience
        </Link>
      </Section>

      <Section index="03" title="Stack">
        <div className="space-y-4">
          {skillGroups.map((group) => (
            <div
              key={group.category}
              className="grid gap-1 border-t border-line/60 pt-4 sm:grid-cols-[160px_1fr] sm:gap-6"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-faint">
                {group.category}
              </p>
              <p className="text-sm leading-6 text-fg-muted">
                {group.skills.join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
