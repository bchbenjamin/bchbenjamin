"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { Achievement } from "@/lib/content";

export default function AchievementGallery({ achievements }: { achievements: Achievement[] }) {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const items = [...achievements].sort((a, b) => (b.awardedOn ?? "").localeCompare(a.awardedOn ?? ""));

  useEffect(() => {
    if (reduceMotion || items.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % items.length), 6800);
    return () => window.clearInterval(timer);
  }, [items.length, reduceMotion]);

  if (!items.length) return null;
  const current = items[active % items.length];
  const step = (direction: number) => setActive((value) => (value + direction + items.length) % items.length);

  return (
    <section className="shell achievement-gallery" aria-label="Latest achievements and milestones" data-reveal>
      <div className="achievement-gallery-heading">
        <div><p className="eyebrow"><span className="eyebrow-line" /> FIELD NOTES / LATEST MILESTONES</p><h2>Recent <span>highlights.</span></h2></div>
        <div className="gallery-controls">
          <span className="gallery-count">{String(active + 1).padStart(2, "0")} <i>/</i> {String(items.length).padStart(2, "0")}</span>
          <button type="button" aria-label="Previous achievement" onClick={() => step(-1)}>←</button>
          <button type="button" aria-label="Next achievement" onClick={() => step(1)}>→</button>
        </div>
      </div>
      <div className="achievement-gallery-stage" onMouseEnter={() => undefined}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.article className="achievement-feature" key={current.title + active} initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, y: -12, scale: 0.99 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
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
          {items.map((item, index) => <button key={`${item.title}-${index}`} role="tab" aria-selected={active === index} aria-label={`Show ${item.title}`} className={active === index ? "gallery-rail-item active" : "gallery-rail-item"} onClick={() => setActive(index)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><i /></button>)}
        </div>
      </div>
    </section>
  );
}
