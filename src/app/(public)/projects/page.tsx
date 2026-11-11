import type { Metadata } from "next";

import { ProjectCard } from "@/components/project-card";
import { getPublicItemsByType } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected software projects: what they do, what was hard, and how they were built.",
};

export default function ProjectsPage() {
  const projects = getPublicItemsByType("PROJECT");

  return (
    <div className="py-16 sm:py-24">
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
          01 — Work
        </p>
        <h1 className="mt-4 text-4xl font-medium tracking-[-0.025em] text-fg sm:text-5xl">
          Projects
        </h1>
        <p className="mt-5 text-[15px] leading-7 text-fg-muted">
          Side projects and small systems, kept deliberately narrow so they stay
          understandable. Each one is written up with the constraint that shaped it.
        </p>
      </header>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {projects.map((item, index) => (
          <ProjectCard key={item.id} item={item} index={index + 1} />
        ))}
      </div>
    </div>
  );
}
