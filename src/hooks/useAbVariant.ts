"use client";

import { useEffect, useState } from "react";

export type AbVariant = "A" | "B";

export function useAbVariant(): AbVariant {
  const [variant, setVariant] = useState<AbVariant>("A");

  useEffect(() => {
    let v = localStorage.getItem("sparkAbVariant") as AbVariant | null;
    if (!v) {
      v = Math.random() < 0.5 ? "A" : "B";
      localStorage.setItem("sparkAbVariant", v);
    }
    setVariant(v);
  }, []);

  return variant;
}
