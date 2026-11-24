"use client";

import { useEffect, useRef } from "react";

type Ripple = { x: number; y: number; born: number; strength: number };

/** Lightweight Canvas recreation of the liquid-water live wallpaper used on early Android phones. */
export default function WaterWallpaper() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripples = useRef<Ripple[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) return;
    let frame = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const draw = (now: number) => {
      const t = now * 0.00016;
      const sky = context.createLinearGradient(0, 0, width, height);
      sky.addColorStop(0, "#6e9da8");
      sky.addColorStop(0.38, "#2e6e7d");
      sky.addColorStop(1, "#071d2a");
      context.fillStyle = sky;
      context.fillRect(0, 0, width, height);

      const light = context.createRadialGradient(width * (0.2 + Math.sin(t) * 0.04), height * 0.22, 2, width * 0.35, height * 0.35, width * 0.8);
      light.addColorStop(0, "rgba(215,245,236,.42)");
      light.addColorStop(0.34, "rgba(85,175,183,.16)");
      light.addColorStop(1, "rgba(0,15,28,0)");
      context.fillStyle = light;
      context.fillRect(0, 0, width, height);

      // Soft moving reflection bands give the water depth without a heavy WebGL shader.
      for (let band = 0; band < 18; band++) {
        const y = height * (0.28 + band * 0.043);
        const amplitude = 2 + band * 0.42;
        context.beginPath();
        for (let x = 0; x <= width + 4; x += 4) {
          const wave = Math.sin(x * (0.012 + band * 0.00018) + t * (2.4 + band * 0.07) + band) * amplitude;
          const secondary = Math.sin(x * 0.027 - t * 1.7 + band * 0.7) * 1.8;
          const py = y + wave + secondary;
          if (x === 0) context.moveTo(x, py); else context.lineTo(x, py);
        }
        context.strokeStyle = `rgba(185,235,226,${0.025 + (band % 4) * 0.012})`;
        context.lineWidth = 1 + (band % 3) * 0.45;
        context.stroke();
      }

      ripples.current = ripples.current.filter(ripple => now - ripple.born < 2600);
      for (const ripple of ripples.current) {
        const age = (now - ripple.born) / 2600;
        const radius = age * Math.min(width, height) * 0.34;
        for (let ring = 0; ring < 3; ring++) {
          const r = radius - ring * 10;
          if (r <= 0) continue;
          context.beginPath();
          context.ellipse(ripple.x, ripple.y, r, r * 0.32, 0, 0, Math.PI * 2);
          context.strokeStyle = `rgba(218,249,242,${(1 - age) * ripple.strength * (0.26 - ring * 0.055)})`;
          context.lineWidth = 1.4;
          context.stroke();
        }
      }
      frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);

    const addRipple = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest(".jb-home-viewport")) return;
      const bounds = canvas.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
      ripples.current.push({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, born: performance.now(), strength: 1 });
      if (ripples.current.length > 12) ripples.current.shift();
    };
    window.addEventListener("pointerdown", addRipple, { passive: true });
    return () => { window.cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("pointerdown", addRipple); };
  }, []);

  return <canvas ref={canvasRef} className="jb-water-wallpaper" aria-hidden="true" />;
}
