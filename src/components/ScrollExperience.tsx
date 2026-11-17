"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ScrollExperience() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 0.85
    });

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

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

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((element) => {
        gsap.to(element, { yPercent: -9, ease: "none", scrollTrigger: {
          trigger: element, start: "top bottom", end: "bottom top", scrub: 0.8
        }});
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
      context.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
