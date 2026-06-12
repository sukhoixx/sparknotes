"use client";

import { useEffect, useRef, useState } from "react";
import type { Post } from "@/app/web/posts/[id]/types";

const REACTIONS = ["😮", "❤️", "😂", "😢", "😡", "👍"] as const;

const DOMAIN_NAMES: Record<string, string> = {
  "bloomberg.com": "Bloomberg", "reuters.com": "Reuters", "apnews.com": "AP News",
  "nytimes.com": "NY Times", "washingtonpost.com": "Washington Post", "wsj.com": "Wall Street Journal",
  "cnn.com": "CNN", "foxnews.com": "Fox News", "nbcnews.com": "NBC News", "cbsnews.com": "CBS News",
  "go.com": "ABC News", "msnbc.com": "MSNBC", "usatoday.com": "USA Today", "nypost.com": "NY Post",
  "latimes.com": "LA Times", "politico.com": "Politico", "thehill.com": "The Hill",
  "axios.com": "Axios", "vox.com": "Vox", "theatlantic.com": "The Atlantic",
  "newyorker.com": "The New Yorker", "time.com": "TIME", "newsweek.com": "Newsweek",
  "huffpost.com": "HuffPost", "slate.com": "Slate", "npr.org": "NPR",
  "businessinsider.com": "Business Insider", "forbes.com": "Forbes", "fortune.com": "Fortune",
  "cnbc.com": "CNBC", "marketwatch.com": "MarketWatch", "inc.com": "Inc.",
  "fastcompany.com": "Fast Company", "hbr.org": "Harvard Business Review",
  "bbc.com": "BBC", "bbc.co.uk": "BBC", "theguardian.com": "The Guardian",
  "independent.co.uk": "The Independent", "ft.com": "Financial Times",
  "aljazeera.com": "Al Jazeera", "dw.com": "DW", "france24.com": "France 24",
  "foreignpolicy.com": "Foreign Policy", "thediplomat.com": "The Diplomat",
  "techcrunch.com": "TechCrunch", "wired.com": "Wired", "theverge.com": "The Verge",
  "arstechnica.com": "Ars Technica", "engadget.com": "Engadget", "9to5mac.com": "9to5Mac",
  "macrumors.com": "MacRumors", "venturebeat.com": "VentureBeat", "cnet.com": "CNET",
  "technologyreview.com": "MIT Technology Review", "nature.com": "Nature",
  "scientificamerican.com": "Scientific American", "nasa.gov": "NASA",
  "nationalgeographic.com": "Nat Geo", "espn.com": "ESPN", "si.com": "Sports Illustrated",
  "theathletic.com": "The Athletic", "variety.com": "Variety",
  "hollywoodreporter.com": "Hollywood Reporter", "deadline.com": "Deadline",
  "people.com": "People", "tmz.com": "TMZ", "scmp.com": "SCMP",
  "straitstimes.com": "Straits Times", "channelnewsasia.com": "CNA",
};

function getSourceName(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join(".");
      if (DOMAIN_NAMES[candidate]) return DOMAIN_NAMES[candidate];
    }
    return (parts[parts.length - 2] ?? parts[0]).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  } catch { return null; }
}

const FONT_SIZES = [
  { body: 17, label: "A" },
  { body: 20, label: "A+" },
  { body: 23, label: "A++" },
] as const;

interface Comment { id: number; text: string; screenName: string; createdAt: string; }

const C = {
  bg: "#f5f5f7", surface: "#ffffff", surfaceAlt: "#f3f4f6",
  border: "#e5e7eb", text: "#1a1a1a", textSub: "#374151",
  textMuted: "#9ca3af", brand: "#ff2442",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ArticlePage({ post }: { post: Post }) {
  const [reactions, setReactions] = useState<Record<string, number>>(post.reactions ?? {});
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fontIdx, setFontIdx] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const tags = Array.isArray(post.tags) ? (post.tags as string[]) : [];
  const sourceName = getSourceName(post.sourceUrl);
  const appLink = `https://sparknotes-production.up.railway.app/posts/${post.id}`;

  useEffect(() => {
    fetch("/api/me/likes").then(r => r.json()).then(d => {
      setIsAuthenticated(true);
      const myEntry = (d.reactions ?? []).find((r: { postId: number; emoji: string }) => r.postId === post.id);
      if (myEntry) setMyReaction(myEntry.emoji);
    }).catch(() => {});
    fetch(`/api/posts/${post.id}/comments`).then(r => r.json()).then(d => {
      setComments(d.comments ?? []);
      setCommentsLoading(false);
    });
  }, [post.id]);

  function handleReact(emoji: string) {
    const isUndo = myReaction === emoji;
    const newReaction = isUndo ? null : emoji;
    setMyReaction(newReaction);
    setReactions(prev => {
      const next = { ...prev };
      if (myReaction && next[myReaction]) {
        next[myReaction] = Math.max(0, (next[myReaction] ?? 1) - 1);
        if (next[myReaction] === 0) delete next[myReaction];
      }
      if (newReaction) next[newReaction] = (next[newReaction] ?? 0) + 1;
      return next;
    });
    fetch(`/api/posts/${post.id}/like`, {
      method: isUndo ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: isUndo ? undefined : JSON.stringify({ emoji }),
    }).catch(() => {});
    setPickerOpen(false);
  }

  async function submitComment() {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: commentText }),
    });
    const data = await res.json();
    if (data.comment) {
      setComments(prev => [...prev, data.comment]);
      setCommentText("");
    }
    setSubmitting(false);
  }

  const reactionEntries = Object.entries(reactions).filter(([, n]) => n > 0);

  const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const fontSize = FONT_SIZES[fontIdx].body;

  return (
    <div style={{ fontFamily: F, background: C.bg, minHeight: "100vh" }}>
      {/* Ad banner placeholder — matches iOS top ad slot */}
      <div style={{ background: C.surfaceAlt, minHeight: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", minHeight: 60 }}
          data-ad-client="ca-pub-2618352557321545"
          data-ad-slot="6335999163"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>

      {/* Header bar — constrained to article width */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/web" style={{
            width: 32, height: 32, borderRadius: 16, background: C.surfaceAlt,
            display: "flex", alignItems: "center", justifyContent: "center",
            textDecoration: "none", color: C.textSub, fontSize: 14, fontWeight: 600,
          }}>✕</a>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setFontIdx(i => (i + 1) % FONT_SIZES.length)}
              style={{
                width: 36, height: 36, borderRadius: 18,
                background: fontIdx > 0 ? C.brand + "33" : C.surfaceAlt,
                border: 0, cursor: "pointer", fontSize: 13, fontWeight: 700,
                color: fontIdx > 0 ? C.brand : C.textMuted,
              }}
            >
              {FONT_SIZES[fontIdx].label}
            </button>
          </div>

          {/* Reaction button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setPickerOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: 0, cursor: "pointer", padding: "4px 8px",
              }}
            >
              {reactionEntries.length > 0
                ? reactionEntries.map(([emoji, count]) => (
                    <span key={emoji} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <span style={{ fontSize: 22 }}>{emoji}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.textSub }}>{count}</span>
                    </span>
                  ))
                : <span style={{ fontSize: 22, opacity: 0.35 }}>😮</span>
              }
            </button>
            {pickerOpen && (
              <div style={{
                position: "absolute", right: 0, top: 44, zIndex: 200,
                background: C.surface, borderRadius: 32,
                padding: "6px 8px", display: "flex", gap: 2,
                boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
              }}>
                {REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    style={{
                      width: 44, height: 44, borderRadius: 22, border: 0, cursor: "pointer",
                      fontSize: 26, background: myReaction === emoji ? C.surfaceAlt : "transparent",
                      transform: myReaction === emoji ? "scale(1.2)" : "scale(1)",
                      transition: "transform 0.15s",
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable article content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 16, paddingBottom: 120 }}>
        {/* Date + source */}
        <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 12 }}>
          {new Date(post.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
          {sourceName && <span style={{ color: C.textMuted }}>{`  |  ${sourceName}`}</span>}
        </p>

        {/* Title */}
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1.3, marginBottom: 16 }}>
          {post.title}
        </h1>

        {/* Hero image */}
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt=""
            style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 12, marginBottom: 16, display: "block" }}
          />
        )}

        {/* Body */}
        <div
          style={{ fontSize, lineHeight: 1.7, color: C.textSub, marginBottom: 16 }}
          dangerouslySetInnerHTML={{ __html: post.body }}
        />

        {/* Fun fact */}
        {post.funFact && (
          <div style={{
            background: "#fffbeb", borderRadius: 12, padding: 14, marginBottom: 16,
            borderLeft: "3px solid #f59e0b", fontSize: 15, lineHeight: 1.6, color: "#92400e",
          }}
            dangerouslySetInnerHTML={{ __html: post.funFact }}
          />
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
            {tags.map(tag => (
              <span key={tag} style={{ background: C.surfaceAlt, color: "#6b7280", fontSize: 14, padding: "4px 10px", borderRadius: 12 }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Source + share row */}
        {post.sourceUrl && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            <a
              href={post.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ border: `1.5px solid ${C.brand}`, borderRadius: 16, padding: "7px 16px", color: C.brand, fontSize: 15, fontWeight: 700, textDecoration: "none" }}
            >
              View Source
            </a>
            {/* Share buttons */}
            {[
              { label: "f", color: "#1877f2", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appLink)}` },
              { label: "𝕏", color: "#000", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(appLink)}&text=${encodeURIComponent(post.title)}` },
              { label: "🔗", color: C.textMuted, href: appLink, onClick: (e: React.MouseEvent) => { e.preventDefault(); navigator.clipboard?.writeText(appLink); } },
            ].map(({ label, color, href, onClick }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClick}
                style={{
                  width: 34, height: 34, borderRadius: 17, background: C.surfaceAlt,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 700, color, textDecoration: "none",
                }}
              >
                {label}
              </a>
            ))}
          </div>
        )}

        {/* Comments header */}
        <p style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>
          {comments.length} Comment{comments.length === 1 ? "" : "s"}
        </p>

        {commentsLoading && (
          <div style={{ textAlign: "center", padding: "16px 0", color: C.textMuted }}>Loading…</div>
        )}

        {comments.map(c => (
          <div key={c.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.brand }}>{c.screenName}</span>
              <span style={{ fontSize: 13, color: C.textMuted }}>{timeAgo(c.createdAt)}</span>
            </div>
            <p style={{ fontSize: 16, color: C.textSub, lineHeight: 1.5, margin: 0 }}>{c.text}</p>
          </div>
        ))}
      </div>

      {/* Fixed comment input bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: C.surface, borderTop: `1px solid ${C.border}`,
        padding: "10px 12px 24px",
        display: "flex", alignItems: "flex-end", gap: 8,
        maxWidth: 720, margin: "0 auto",
      }}>
        <textarea
          ref={commentInputRef}
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
          placeholder={isAuthenticated ? "Add a comment…" : "Sign in to comment…"}
          rows={1}
          style={{
            flex: 1, background: C.surfaceAlt, border: 0, borderRadius: 20,
            padding: "10px 14px", fontSize: 14, color: C.text,
            resize: "none", outline: "none", fontFamily: F, maxHeight: 100,
          }}
        />
        <button
          onClick={submitComment}
          disabled={!commentText.trim() || submitting}
          style={{
            width: 36, height: 36, borderRadius: 18, background: C.brand,
            border: 0, cursor: "pointer", color: "#fff", fontSize: 16, fontWeight: 700,
            opacity: !commentText.trim() || submitting ? 0.4 : 1, flexShrink: 0,
          }}
        >
          ↑
        </button>
      </div>

      {/* Close picker on outside click */}
      {pickerOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 199 }}
          onClick={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
