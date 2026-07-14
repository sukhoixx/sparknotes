import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/ai";
import type { Category } from "@/lib/ai";
import BodyStyle from "./BodyStyle";
import ArticlePage from "./ArticlePage";

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
      url: `https://sparknotes-production.up.railway.app/posts/${id}`,
      images: post.imageUrl ? [{ url: post.imageUrl }] : [],
    },
  };
}

export default async function WebPostPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const raw = await prisma.post.findUnique({ where: { id } });
  if (!raw) notFound();

  const meta = CATEGORY_META[raw.category as Category];
  const gradient = meta?.gradient ?? raw.gradient;

  // Serialize for client — Dates must be strings
  const post = {
    id: raw.id,
    title: raw.title,
    body: raw.body,
    funFact: raw.funFact,
    tags: raw.tags,
    category: raw.category,
    badge: raw.badge,
    authorEmoji: raw.authorEmoji,
    authorBg: raw.authorBg,
    sourceUrl: raw.sourceUrl,
    imageUrl: raw.imageUrl,
    gradient,
    reactions: {} as Record<string, number>,
    createdAt: raw.createdAt.toISOString(),
    publishedAt: raw.publishedAt.toISOString(),
  };

  return (
    <>
      <BodyStyle />
      <ArticlePage post={post} />
    </>
  );
}
