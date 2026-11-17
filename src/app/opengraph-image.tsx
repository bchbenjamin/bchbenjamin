import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "B C H Benjamin — Computer Science Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          <span style={{ padding: "14px 16px", border: "1px solid #6798ff", color: "#6798ff" }}>BCH</span>
          <span>BENJAMIN</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "880px" }}>
          <div style={{ fontSize: 22, color: "#9d9da5", letterSpacing: 5 }}>PYTHON · DATA ENGINEERING · ARTIFICIAL INTELLIGENCE</div>
          <div style={{ fontSize: 76, lineHeight: 1.04, fontWeight: 600 }}>Computer Science, Python Development and Technical Research.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 21, color: "#a8a8b0" }}>
          <span>FULL-STACK / APPLIED AI / EDGE COMPUTING</span>
          <span>bchbenjamin.in</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
