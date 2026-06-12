import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/ai";
import type { Category } from "@/lib/ai";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = parseInt(params.id);
  if (isNaN(id)) return {};
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return {};
  return {
    title: `${post.title} — NewsBlock`,
    description: post.snippet,
    openGraph: {
      title: post.title,
      description: post.snippet,
      images: post.imageUrl ? [{ url: post.imageUrl }] : [],
    },
  };
}

export default async function WebPostPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  const meta = CATEGORY_META[post.category as Category];
  const gradient = meta?.gradient ?? post.gradient;
  const tags = Array.isArray(post.tags) ? (post.tags as string[]) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#000000", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Top nav */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "#1c1c1e", borderBottom: "1px solid #3a3a3c", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href="/web"
          style={{ color: "#ff2442", fontSize: 14, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
        >
          ← Back
        </Link>
        <span style={{ color: "#6b6b6b", fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {post.badge}
        </span>
      </div>

      {/* Article content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 0 80px" }}>
        {/* Hero image */}
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={post.title}
            style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
          />
        )}

        {/* Title strip */}
        <div style={{ background: gradient, padding: "20px 20px 20px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 8, margin: "0 0 8px" }}>{post.badge}</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.3, margin: 0 }}>{post.title}</h1>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 20px 0" }}>
          {/* Meta row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: "linear-gradient(135deg, #6c47ff, #00b4d8)",
              color: "#fff", fontSize: 10, fontWeight: 700,
              padding: "3px 10px", borderRadius: 10,
            }}>
              ✨ AI Summary
            </span>
            <span style={{ fontSize: 11, color: "#6b6b6b" }}>
              {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          {/* Article body */}
          <div
            style={{ fontSize: 15, lineHeight: 1.7, color: "#bbbbbb", marginBottom: 16 }}
            dangerouslySetInnerHTML={{ __html: post.body }}
          />

          {/* Fun fact */}
          <div style={{
            background: "#1c1c1e",
            borderLeft: "3px solid #ff2442",
            borderRadius: "0 10px 10px 0",
            padding: "10px 14px",
            margin: "14px 0",
            fontSize: 14,
            color: "#bbbbbb",
          }}
            dangerouslySetInnerHTML={{ __html: post.funFact }}
          />

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
              {tags.map((tag) => (
                <span key={tag} style={{ background: "#1c1c1e", color: "#8e8e93", fontSize: 12, padding: "4px 10px", borderRadius: 12 }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Author row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0", borderTop: "1px solid #3a3a3c", borderBottom: "1px solid #3a3a3c", marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: post.authorBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
              {post.authorEmoji}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#f2f2f7", margin: 0 }}>{post.badge.split(" ").slice(1).join(" ")}</p>
              <p style={{ fontSize: 12, color: "#6b6b6b", margin: "2px 0 0" }}>AI-generated · AI-verified</p>
            </div>
            {post.sourceUrl && (
              <a
                href={post.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#ff2442", border: "1px solid #ff2442", borderRadius: 16, padding: "6px 16px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}
              >
                Source
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
