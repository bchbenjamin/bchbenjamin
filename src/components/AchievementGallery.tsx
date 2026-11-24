"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { Achievement } from "@/lib/content";

export default function AchievementGallery({ achievements }: { achievements: Achievement[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [motionPaused, setMotionPaused] = useState(() => typeof document !== "undefined" && document.documentElement.dataset.motionPaused === "true");
  const reduceMotion = useReducedMotion();
  const motionAllowed = reduceMotion === false;
  const items = [...achievements].sort((a, b) => (b.awardedOn ?? "").localeCompare(a.awardedOn ?? ""));

  useEffect(() => {
    const onMotionChange = (event: Event) => {
      setMotionPaused((event as CustomEvent<{ paused: boolean }>).detail?.paused ?? false);
    };
    window.addEventListener("portfolio:motion", onMotionChange);
    return () => window.removeEventListener("portfolio:motion", onMotionChange);
  }, []);

  useEffect(() => {
    if (!motionAllowed || paused || motionPaused || items.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % items.length), 6800);
    return () => window.clearInterval(timer);
  }, [items.length, motionAllowed, motionPaused, paused]);

  if (!items.length) return null;
  const current = items[active % items.length];
  const disableMotion = !motionAllowed || motionPaused;
  const step = (direction: number) => setActive((value) => (value + direction + items.length) % items.length);

  return (
    <section className="shell achievement-gallery" aria-label="Latest achievements and milestones" data-reveal>
      <div className="achievement-gallery-heading">
        <div><p className="eyebrow"><span className="eyebrow-line" /> FIELD NOTES / LATEST MILESTONES</p><h2>Recent <span>highlights.</span></h2></div>
        <div className="gallery-controls">
          <span className="gallery-count">{String(active + 1).padStart(2, "0")} <i>/</i> {String(items.length).padStart(2, "0")}</span>
          <motion.button type="button" aria-label="Previous achievement" onClick={() => step(-1)} whileHover={disableMotion ? undefined : { scale: 1.08 }} whileTap={disableMotion ? undefined : { scale: 0.9 }}>←</motion.button>
          <motion.button type="button" aria-label="Next achievement" onClick={() => step(1)} whileHover={disableMotion ? undefined : { scale: 1.08 }} whileTap={disableMotion ? undefined : { scale: 0.9 }}>→</motion.button>
        </div>
      </div>
      <div className="achievement-gallery-stage" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.article className="achievement-feature" key={current.title + active} initial={disableMotion ? false : { opacity: 0, y: 18, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={disableMotion ? undefined : { opacity: 0, y: -12, scale: 0.99 }} transition={disableMotion ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
            <div className="achievement-feature-media">
              {current.imageUrl ? <Image src={current.imageUrl} alt={current.title} fill sizes="(max-width: 900px) 100vw, 48vw" unoptimized /> : <div className="achievement-art-fallback" aria-hidden="true"><span>{current.label.slice(0, 16)}</span><strong>{current.title.slice(0, 1).toUpperCase()}</strong><i /></div>}
              <div className="achievement-media-shade" />
              <span className="achievement-media-index">MILESTONE / {String(active + 1).padStart(2, "0")}</span>
            </div>
            <div className="achievement-feature-copy">
              <div className="achievement-feature-meta"><span>{current.label}</span><span>{current.awardedOn ? new Date(`${current.awardedOn}T00:00:00`).toLocaleDateString("en", { month: "short", year: "numeric" }) : "PERSONAL MILESTONE"}</span></div>
              <h3>{current.title}</h3>
              <p>{current.detail}</p>
              <div className="achievement-feature-bottom"><span>SELECTED HIGHLIGHT</span><span>↗</span></div>
            </div>
          </motion.article>
        </AnimatePresence>
        <div className="achievement-gallery-rail" role="tablist" aria-label="Choose achievement">
          {items.map((item, index) => <motion.button key={`${item.title}-${index}`} role="tab" aria-selected={active === index} aria-label={`Show ${item.title}`} className={active === index ? "gallery-rail-item active" : "gallery-rail-item"} onClick={() => setActive(index)} whileHover={disableMotion ? undefined : { x: 3 }} whileTap={disableMotion ? undefined : { scale: 0.985 }}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong>{active === index ? <motion.i layoutId="achievement-rail-marker" transition={{ type: "spring", stiffness: 520, damping: 34 }} /> : <i />}</motion.button>)}
        </div>
      </div>
    </section>
  );
}
