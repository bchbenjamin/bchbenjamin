"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const storageKey = "bch-portfolio-saved-projects";
function readSavedProjects(): string[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

type Props = { slug: string; name: string };

export default function SaveProjectButton({ slug, name }: Props) {
  const [saved, setSaved] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = (event?: Event) => {
      const detail = (event as CustomEvent<string[]> | undefined)?.detail;
      const projects = Array.isArray(detail) ? detail : readSavedProjects();
      setSaved(projects.includes(slug));
      setCount(projects.length);
    };
    sync();
    window.addEventListener("portfolio:saved-projects", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("portfolio:saved-projects", sync);
      window.removeEventListener("storage", sync);
    };
  }, [slug]);

  function toggleSaved(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const current = readSavedProjects();
    const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
    try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* the toggle still works for this mounted session */ }
    setSaved(next.includes(slug));
    setCount(next.length);
    window.dispatchEvent(new CustomEvent("portfolio:saved-projects", { detail: next }));
  }

  return (
    <motion.button
      type="button"
      className={`project-save-button${saved ? " is-saved" : ""}`}
      aria-pressed={saved}
      aria-label={`${saved ? "Remove" : "Save"} ${name} ${saved ? "from" : "to"} saved projects`}
      title={saved ? "Remove from saved projects" : "Save this project on this device"}
      onClick={toggleSaved}
      whileHover={{ y: -2, scale: 1.035 }}
      whileTap={{ scale: 0.9, rotate: saved ? -7 : 7 }}
      transition={{ type: "spring", stiffness: 440, damping: 24 }}
    >
      <svg className="project-save-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.75h11a1.5 1.5 0 0 1 1.5 1.5V21l-7-4.2L5 21V5.25a1.5 1.5 0 0 1 1.5-1.5Z" /></svg>
      <span>{saved ? "Saved" : "Save"}</span>
      <span className="project-save-count" aria-live="polite">{count}</span>
    </motion.button>
  );
}
