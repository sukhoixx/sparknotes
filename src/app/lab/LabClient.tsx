"use client";

import { useState } from "react";

export interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const C = {
  bg: "#f5f5f7", surface: "#ffffff", border: "#e5e7eb",
  text: "#1a1a1a", textSub: "#374151", textMuted: "#9ca3af",
  brand: "#ff2442",
};

export default function LabClient({ items }: { items: FeedItem[] }) {
  const [selected, setSelected] = useState<FeedItem | null>(null);
  const [articleText, setArticleText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"idle" | "fetching" | "summarizing" | "done">("idle");

  async function handleSelect(item: FeedItem) {
    setSelected(item);
    setArticleText("");
    setSummary("");
    setError("");
    setLoading(true);
    setStep("fetching");

    try {
      const res = await fetch("/api/lab/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.link, title: item.title }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setStep("idle");
      } else {
        setStep("done");
        setArticleText(data.articleText ?? "");
        setSummary(data.summary ?? "");
      }
    } catch {
      setError("Network error");
      setStep("idle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: F, background: C.bg, minHeight: "100vh", padding: "24px 16px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.brand, margin: "0 0 4px" }}>
            📰 NewsBlock Lab
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>
            BBC News RSS → Full article via Jina → AI summary via DeepSeek
          </p>
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Feed list */}
          <div style={{ width: 320, flexShrink: 0, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              BBC News — Latest Headlines
            </div>
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSelect(item)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "12px 16px", border: 0, borderBottom: `1px solid ${C.border}`,
                  cursor: "pointer", transition: "background 0.1s",
                  background: selected?.link === item.link ? "#fff0f2" : "transparent",
                  borderLeft: selected?.link === item.link ? `3px solid ${C.brand}` : "3px solid transparent",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: "0 0 4px", lineHeight: 1.4 }}>
                  {item.title}
                </p>
                <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>
                  {item.pubDate}
                </p>
              </button>
            ))}
          </div>

          {/* Article + summary panel */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {!selected && (
              <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 40, textAlign: "center", color: C.textMuted, fontSize: 14 }}>
                ← Select an article to fetch and summarize
              </div>
            )}

            {selected && (
              <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                {/* Article header */}
                <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 8px", lineHeight: 1.3 }}>
                    {selected.title}
                  </h2>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: C.textMuted }}>{selected.pubDate}</span>
                    <a href={selected.link} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: C.brand, textDecoration: "none", fontWeight: 600 }}>
                      View original ↗
                    </a>
                  </div>
                </div>

                {/* Status */}
                {loading && (
                  <div style={{ padding: "20px 24px", color: C.textMuted, fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 16, height: 16, border: "2px solid #e5e7eb", borderTopColor: C.brand, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    {step === "fetching" ? "Fetching full article via Jina…" : "Generating AI summary…"}
                  </div>
                )}

                {error && (
                  <div style={{ padding: "20px 24px", color: C.brand, fontSize: 14 }}>
                    ⚠️ {error}
                  </div>
                )}

                {/* AI Summary */}
                {summary && (
                  <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span style={{
                        background: "linear-gradient(135deg, #6c47ff, #00b4d8)",
                        color: "#fff", fontSize: 11, fontWeight: 700,
                        padding: "3px 10px", borderRadius: 10,
                      }}>✨ AI Summary</span>
                      <span style={{ fontSize: 11, color: C.textMuted }}>DeepSeek · {summary.length} chars</span>
                    </div>
                    {summary.split("\n\n").map((para, i) => (
                      <p key={i} style={{ fontSize: 15, lineHeight: 1.7, color: C.textSub, margin: "0 0 12px" }}>
                        {para}
                      </p>
                    ))}
                  </div>
                )}

                {/* Full article text */}
                {articleText && (
                  <div style={{ padding: "20px 24px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
                      Full article text (via Jina) — {articleText.length} chars
                    </p>
                    <pre style={{
                      fontSize: 12, lineHeight: 1.6, color: C.textSub,
                      whiteSpace: "pre-wrap", wordBreak: "break-word",
                      background: C.bg, borderRadius: 8, padding: 16, margin: 0,
                      maxHeight: 400, overflowY: "auto",
                    }}>
                      {articleText}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
