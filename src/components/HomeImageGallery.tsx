"use client";

import Link from "next/link";
import { useRef } from "react";
import ProjectArtwork from "@/components/ProjectArtwork";
import type { Project } from "@/lib/content";

export default function HomeImageGallery({ projects }: { projects: Project[] }) {
  const rail = useRef<HTMLDivElement>(null);
  if (!projects.length) return null;

  function move(direction: -1 | 1) {
    const element = rail.current;
    if (!element) return;
    const card = element.querySelector<HTMLElement>(".home-gallery-card");
    const distance = card ? card.getBoundingClientRect().width + 18 : element.clientWidth * 0.78;
    element.scrollBy({ left: distance * direction, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  return (
    <section className="home-image-gallery" aria-label="Selected project image gallery">
      <div className="shell home-gallery-heading">
        <div><p className="eyebrow"><span className="eyebrow-line" /> SELECTED WORK / A VISUAL INDEX</p><h2>Things I’ve <span>built.</span></h2></div>
        <div className="home-gallery-controls" aria-label="Gallery controls">
          <span>{String(projects.length).padStart(2, "0")} PROJECTS</span>
          <button type="button" aria-label="Scroll gallery left" onClick={() => move(-1)}>←</button>
          <button type="button" aria-label="Scroll gallery right" onClick={() => move(1)}>→</button>
        </div>
      </div>
      <div className="home-gallery-viewport" ref={rail} tabIndex={0} aria-label="Horizontally scrollable project gallery">
        {projects.map((project, index) => (
          <Link className="home-gallery-card" href={`/projects/${project.slug}`} key={project.slug}>
            <ProjectArtwork project={project} priority={index === 0} />
            <span className="home-gallery-number">0{index + 1} / {project.period ? `${project.period} / ` : ""}{project.category}</span>
            <span className="home-gallery-title">{project.name}<i aria-hidden="true">↗</i></span>
            <span className="home-gallery-summary">{project.summary}</span>
          </Link>
        ))}
      </div>
      <div className="shell home-gallery-foot"><span>DRAG / SWIPE TO EXPLORE</span><span>SCROLL TO DISCOVER</span></div>
    </section>
  );
}
