"use client";

import dynamic from "next/dynamic";

const HeroShader = dynamic(() => import("./HeroShader"), {
  ssr: false,
  loading: () => <div className="hero-shader hero-shader-fallback" aria-hidden="true" />
});

export default function HeroShaderLoader() {
  return <HeroShader />;
}
