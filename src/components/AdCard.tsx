"use client";

import { useEffect, useRef } from "react";

export default function AdCard() {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      // Push the ad unit after mount
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div style={{ background: "#ffffff", overflow: "hidden", position: "relative" }}>
      {/* Ad label */}
      <div style={{
        position: "absolute", top: 6, right: 8, zIndex: 1,
        border: "1px solid rgba(0,0,0,0.2)", borderRadius: 4,
        padding: "1px 4px", fontSize: 9, fontWeight: 600, color: "rgba(0,0,0,0.35)",
      }}>
        Ad
      </div>

      {/* Aspect-video placeholder background shown while ad loads */}
      <div className="w-full aspect-video" style={{ background: "#f3f4f6" }}>
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%", height: "100%" }}
          data-ad-client="ca-pub-2618352557321545"
          data-ad-slot="3769161130"
          data-ad-format="fluid"
          data-ad-layout="in-article"
        />
      </div>

      {/* Content area matching card structure */}
      <div style={{ padding: "8px 10px 10px", minHeight: 60, background: "#f9fafb" }}>
        <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", margin: 0 }}>Sponsored</p>
      </div>
    </div>
  );
}
