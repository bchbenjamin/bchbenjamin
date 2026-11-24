"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { createLiquidGlass, supportsRefraction } from "@/lib/liquid-glass/liquid-glass";

type Props = HTMLAttributes<HTMLElement> & { as?: "div" | "article" | "aside" | "section"; children: ReactNode; radius?: number };

export default function GlassSurface({ as = "div", className = "", children, radius = 22, ...props }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.dataset.liquidGlass = supportsRefraction ? "refractive" : "frosted-fallback";
    const glass = createLiquidGlass(host, { radius, rim: 0.9, blur: 1.6, saturate: 1.2, reflect: false, promote: false });
    return () => glass.destroy();
  }, [radius]);
  const Tag = as;
  return <Tag {...props} ref={ref as Ref<HTMLDivElement>} className={`${className} glass-surface`.trim()}>{children}</Tag>;
}
