"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ScrollExperience() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const cleanups: Array<() => void> = [];

    // Small, pointer-driven depth cues for the hero artwork and project previews.
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.querySelectorAll<HTMLElement>("[data-pointer-tilt]").forEach((element) => {
        const onMove = (event: PointerEvent) => {
          const bounds = element.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width - 0.5;
          const y = (event.clientY - bounds.top) / bounds.height - 0.5;
          element.style.setProperty("--tilt-x", `${-y * 3.2}deg`);
          element.style.setProperty("--tilt-y", `${x * 4.2}deg`);
        };
        const onLeave = () => {
          element.style.setProperty("--tilt-x", "0deg");
          element.style.setProperty("--tilt-y", "0deg");
        };
        element.addEventListener("pointermove", onMove);
        element.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          element.removeEventListener("pointermove", onMove);
          element.removeEventListener("pointerleave", onLeave);
        });
      });
    }

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.fromTo(element, { opacity: 0, y: 28, filter: "blur(5px)" }, {
          opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 88%", once: true }
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-animate-stagger]").forEach((container) => {
        const children = Array.from(container.children) as HTMLElement[];
        gsap.fromTo(children, { y: 22, opacity: 0, scale: 0.985 }, {
          y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.12, ease: "power3.out",
          scrollTrigger: { trigger: container, start: "top 82%", once: true }
        });
      });

      const hero = document.querySelector<HTMLElement>(".hero-copy");
      if (hero) {
        gsap.fromTo(hero.querySelectorAll(".eyebrow, h1, .hero-intro, .hero-actions, .hero-meta"),
          { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.11, ease: "power3.out", delay: 0.12 });
      }
      const art = document.querySelector<HTMLElement>(".hero-art");
      if (art) gsap.fromTo(art, { opacity: 0, scale: 0.94, rotate: 1.5 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.2, ease: "power3.out", delay: 0.28 });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      context.revert();
    };
  }, []);

  return null;
}
