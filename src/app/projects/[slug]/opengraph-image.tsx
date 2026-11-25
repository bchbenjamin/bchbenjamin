import { ImageResponse } from "next/og";
import { getSiteContent } from "@/lib/content";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProjectOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteContent();
  const project = site.projects.find(item => item.slug === slug);
  const name = project?.name ?? "Project";
  const category = project?.category ?? "SELECTED WORK";
  const monogram = site.owner.monogram || "";
  return new ImageResponse(
    (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        color: "#f1f0ed",
        background: "radial-gradient(circle at 82% 48%, #192a4c 0%, #111217 38%, #0b0b0c 76%)",
        fontFamily: "Arial, sans-serif"
      }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", fontSize: 24, letterSpacing: 4 }}>
          <span style={{ color: "#6798ff", border: "1px solid #6798ff", padding: "12px 14px" }}>{monogram}</span>
          <span>SELECTED WORK</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <span style={{ color: "#6798ff", fontSize: 22, letterSpacing: 5 }}>{category}</span>
          <strong style={{ fontSize: 100, lineHeight: 1 }}>{name}</strong>
          <span style={{ fontSize: 28, color: "#b2b2bd" }}>A project by {site.owner.name || "the owner"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#a4a4ad", fontSize: 22 }}>
          <span>SOFTWARE · AI · SYSTEMS</span>
          <span>{site.owner.website.replace(/^https?:\/\//, "") || "Portfolio"}</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
