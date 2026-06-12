"use client";
import { useEffect } from "react";

export default function BodyStyle() {
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const orig = { bMax: body.style.maxWidth, bMargin: body.style.margin, bBg: body.style.background, hBg: html.style.background };
    body.style.maxWidth = "none";
    body.style.margin = "0";
    body.style.background = "#f5f5f7";
    html.style.background = "#f5f5f7";
    return () => {
      body.style.maxWidth = orig.bMax;
      body.style.margin = orig.bMargin;
      body.style.background = orig.bBg;
      html.style.background = orig.hBg;
    };
  }, []);
  return null;
}
