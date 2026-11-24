"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const waveA = "M0 24 C160 6 280 42 440 24 S720 8 880 24 S1120 42 1280 20";
const waveB = "M0 20 C160 40 280 4 440 21 S720 39 880 20 S1120 3 1280 25";

export default function WaveDivider() {
  const reduceMotion = useReducedMotion();
  const [motionPaused, setMotionPaused] = useState(() => typeof document !== "undefined" && document.documentElement.dataset.motionPaused === "true");

  useEffect(() => {
    const onMotionChange = (event: Event) => {
      setMotionPaused((event as CustomEvent<{ paused: boolean }>).detail?.paused ?? false);
    };
    window.addEventListener("portfolio:motion", onMotionChange);
    return () => window.removeEventListener("portfolio:motion", onMotionChange);
  }, []);

  const animateWave = reduceMotion === false && !motionPaused;

  return (
    <div className="wave-divider" aria-hidden="true">
      <motion.svg viewBox="0 0 1280 48" preserveAspectRatio="none">
        <motion.path
          d={waveA}
          animate={animateWave ? { d: [waveA, waveB, waveA] } : { d: waveA }}
          transition={animateWave ? { duration: 16, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
        />
      </motion.svg>
    </div>
  );
}
