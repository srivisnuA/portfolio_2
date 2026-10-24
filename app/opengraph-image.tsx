import { ImageResponse } from "next/og";

export const alt = "Srivisnu A — Software Engineering, AI & Machine Learning, Data Analytics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", background: "#080f1b", color: "#eee9db", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <div style={{ display: "flex", position: "absolute", width: 720, height: 450, borderRadius: "50%", border: "1px solid #334052", transform: "rotate(-25deg)" }} />
      <div style={{ display: "flex", position: "absolute", width: 900, height: 310, borderRadius: "50%", border: "1px solid #293444", transform: "rotate(-25deg)" }} />
      <div style={{ fontSize: 16, letterSpacing: 7, color: "#c8ad77", marginBottom: 28 }}>THE PERSONAL ATLAS</div>
      <div style={{ fontFamily: "serif", fontSize: 120, letterSpacing: -5 }}>Srivisnu A.</div>
      <div style={{ marginTop: 36, fontSize: 22, color: "#b1b9c5", letterSpacing: 1 }}>Software Engineering · AI & Machine Learning · Data Analytics</div>
      <div style={{ position: "absolute", bottom: 42, fontSize: 16, color: "#c8ad77" }}>AN INTERACTIVE 3D EXPEDITION</div>
    </div>, size,
  );
}
