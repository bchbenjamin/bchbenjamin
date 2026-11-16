"use client";

import { useEffect, useRef } from "react";

const vertexShader = [
  "#version 300 es",
  "void main() {",
  "  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));",
  "  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);",
  "}"
].join("\n");

const fragmentShader = [
  "#version 300 es",
  "precision highp float;",
  "uniform vec2 u_resolution;",
  "uniform float u_time;",
  "out vec4 outColor;",
  "void main() {",
  "  vec2 uv = gl_FragCoord.xy / u_resolution;",
  "  vec2 p = uv - vec2(0.56, 0.50);",
  "  p.x *= u_resolution.x / u_resolution.y;",
  "  float radius = length(p);",
  "  float angle = atan(p.y, p.x);",
  "  float field = sin(radius * 34.0 - u_time * 0.26 + sin(angle * 4.0) * 2.0);",
  "  float rings = smoothstep(0.90, 0.99, abs(field));",
  "  float glow = exp(-radius * 2.5);",
  "  float filament = smoothstep(0.97, 1.0, sin(angle * 7.0 + radius * 18.0 - u_time * 0.12));",
  "  vec3 midnight = vec3(0.035, 0.045, 0.075);",
  "  vec3 blue = vec3(0.28, 0.48, 0.88);",
  "  vec3 light = vec3(0.66, 0.76, 0.97);",
  "  vec3 color = midnight + blue * glow * (0.18 + rings * 0.42) + light * filament * glow * 0.10;",
  "  float vignette = 1.0 - smoothstep(0.12, 1.18, radius);",
  "  color *= vignette;",
  "  outColor = vec4(color, 0.92);",
  "}"
].join("\n");

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function HeroShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", { alpha: true, antialias: false });
    if (!canvas || !gl) return;

    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!vertex || !fragment) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const start = performance.now();

    const render = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(rect.width * pixelRatio));
      const height = Math.max(1, Math.floor(rect.height * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform2f(resolutionLocation, width, height);
      gl.uniform1f(timeLocation, reducedMotion ? 0 : (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reducedMotion) frame = window.requestAnimationFrame(render);
    };

    frame = window.requestAnimationFrame(render);
    if (reducedMotion) render(start);

    const resizeObserver = new ResizeObserver(() => {
      if (reducedMotion) render(start);
    });
    resizeObserver.observe(canvas);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return <canvas aria-hidden="true" className="hero-shader" ref={canvasRef} />;
}
