import { ImageResponse } from "next/og";
import { getSiteContent } from "@/lib/content";

export const runtime = "nodejs";
export const alt = "Personal portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const site = await getSiteContent();
  const ownerName = site.owner.name || "Portfolio";
  const focus = site.owner.headline || "Software · AI · Data Engineering";
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
        color: "#f5f5f5",
        background: "#000000",
        fontFamily: "Arial, sans-serif"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: 26, letterSpacing: 4 }}>
          <span style={{ padding: "14px 16px", border: "1px solid #6798ff", color: "#6798ff" }}>{monogram}</span>
          <span>{ownerName.toUpperCase()}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "880px" }}>
          <div style={{ fontSize: 22, color: "#9d9da5", letterSpacing: 5 }}>{focus.toUpperCase()}</div>
          <div style={{ fontSize: 76, lineHeight: 1.04, fontWeight: 600 }}>{site.owner.intro || "Engineering, software and selected technical work."}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 21, color: "#a8a8b0" }}>
          <span>{site.owner.headline || "PERSONAL PORTFOLIO"}</span>
          <span>{site.owner.website.replace(/^https?:\/\//, "") || "Portfolio"}</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
