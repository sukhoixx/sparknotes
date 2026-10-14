import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/ai";
import type { Category } from "@/lib/ai";
import WebFeed from "./WebFeed";
import type { PostWithCount } from "@/components/Feed";

async function getInitialPosts(): Promise<PostWithCount[]> {
  try {
    const raw = await prisma.post.findMany({
      orderBy: { id: "desc" },
      take: 30,
      select: {
        id: true, title: true, snippet: true, body: true, funFact: true,
        tags: true, category: true, categories: true, emoji: true,
        gradient: true, badge: true, authorEmoji: true, authorBg: true,
        sourceUrl: true, imageUrl: true, publishedAt: true, createdAt: true,
        _count: { select: { comments: true } },
      },
    });

    return raw.map((p) => {
      const meta = CATEGORY_META[p.category as Category];
      const cats: string[] = Array.isArray(p.categories)
        ? p.categories as string[]
        : typeof p.categories === "string"
          ? JSON.parse(p.categories)
          : [p.category];
      return {
        ...p,
        gradient: meta?.gradient ?? p.gradient,
        badge: meta?.badge ?? p.badge,
        authorEmoji: meta?.authorEmoji ?? p.authorEmoji,
        authorBg: meta?.authorBg ?? p.authorBg,
        categories: cats,
        tags: Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags as string),
        likes: 0,
        reactions: {},
        publishedAt: p.publishedAt,
        createdAt: p.createdAt,
      } as unknown as PostWithCount;
    });
  } catch {
    return [];
  }
}

export default async function WebPage() {
  const initialPosts = await getInitialPosts();
  return <WebFeed initialPosts={initialPosts} />;
}
