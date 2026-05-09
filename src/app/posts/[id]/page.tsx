import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

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
      url: `https://sparknotes.up.railway.app/posts/${id}`,
      images: post.imageUrl ? [{ url: post.imageUrl }] : [],
    },
  };
}

export default async function PostPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  const appLink = `https://sparknotes.up.railway.app/posts/${id}`;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "-apple-system, sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, maxWidth: 480, width: "100%", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        {post.imageUrl && (
          <img src={post.imageUrl} alt={post.title} style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
        )}
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#ff2442", marginBottom: 16 }}>📰 NewsBlock</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", lineHeight: 1.3, marginBottom: 10 }}>{post.title}</h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.5, marginBottom: 24 }}>{post.snippet}</p>
          <a href={`newsblock://post/${id}`} style={{ display: "block", textAlign: "center", background: "#ff2442", color: "#fff", fontSize: 15, fontWeight: 700, padding: 14, borderRadius: 14, textDecoration: "none", marginBottom: 10 }}>
            Open in NewsBlock
          </a>
          <a href="https://apps.apple.com/app/newsblock/id6766168195" style={{ display: "block", textAlign: "center", background: "#f3f4f6", color: "#374151", fontSize: 14, fontWeight: 600, padding: 13, borderRadius: 14, textDecoration: "none" }}>
            Download NewsBlock on App Store
          </a>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `window.location.href = "newsblock://post/${id}";` }} />
    </div>
  );
}
