"use client";

import { useEffect, useRef, useState } from "react";

export default function AdCard() {
  const [mounted, setMounted] = useState(false);
  const pushed = useRef(false);

  useEffect(() => {
    setMounted(true);
    if (pushed.current) return;
    pushed.current = true;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ background: "#ffffff", position: "relative", width: "100%" }}>
      <ins
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
