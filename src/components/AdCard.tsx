"use client";

import { useEffect } from "react";

export default function AdCard() {
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div style={{ background: "#ffffff", overflow: "hidden", position: "relative" }}>
      <span style={{
        position: "absolute", top: 6, right: 8, zIndex: 1,
        border: "1px solid rgba(0,0,0,0.2)", borderRadius: 4,
        padding: "1px 4px", fontSize: 9, fontWeight: 600, color: "rgba(0,0,0,0.35)",
      }}>Ad</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-2618352557321545"
        data-ad-slot="7698213530"
        data-ad-format="fluid"
        data-ad-layout-key="-6e+dq+u-2k+9n"
      />
    </div>
  );
}
