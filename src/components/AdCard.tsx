"use client";

// Web ad card — mirrors iOS AdCard layout (media area + headline + body + CTA + Ad badge)
// Uses Google AdSense display unit; falls back to a styled placeholder if the script hasn't loaded.
export default function AdCard() {
  return (
    <div style={{
      background: "#ffffff",
      overflow: "hidden",
      marginBottom: 0,
    }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: 260 }}
        data-ad-client="ca-pub-2618352557321545"
        data-ad-slot="3769161130"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
