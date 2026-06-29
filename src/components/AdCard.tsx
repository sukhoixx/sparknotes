"use client";

import { useEffect, useRef, useState } from "react";

export default function AdCard() {
  const [mounted, setMounted] = useState(false);
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !insRef.current) return;
    // Only push if AdSense hasn't already filled this element
    if (insRef.current.getAttribute("data-adsbygoogle-status")) return;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div style={{ background: "#ffffff", position: "relative", width: "100%" }}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client="ca-pub-2618352557321545"
        data-ad-slot="7698213530"
        data-ad-format="fluid"
        data-ad-layout-key="-6e+dq+u-2k+9n"
      />
    </div>
  );
}
