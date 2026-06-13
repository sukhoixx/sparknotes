"use client";

// Mirrors iOS AdCard dimensions: aspect-video image area + content area below
export default function AdCard() {
  return (
    <div style={{ background: "#ffffff", overflow: "hidden" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-2618352557321545"
        data-ad-slot="3769161130"
        data-ad-format="fluid"
        data-ad-layout="in-article"
      />
    </div>
  );
}
