import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  outputFileTracingIncludes: { "/api/v1/admin/[[...path]]": ["./src/lib/server/fonts/DejaVuSans.ttf"] },
  images: { formats: ["image/avif", "image/webp"] }
};

export default nextConfig;
