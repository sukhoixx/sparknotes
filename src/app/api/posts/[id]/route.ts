import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/ai";
import type { Category } from "@/lib/ai";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const post = await prisma.post.findUnique({
    where: { id },
    include: { _count: { select: { comments: true } } },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const groups = await prisma.like.groupBy({
    by: ["emoji"],
    where: { postId: id },
    _count: { emoji: true },
  });
  const reactions: Record<string, number> = {};
  for (const g of groups) reactions[g.emoji] = g._count.emoji;
  const likes = Object.values(reactions).reduce((sum, n) => sum + n, 0);

  const meta = CATEGORY_META[post.category as Category] ?? CATEGORY_META["news"];
  const result = {
    ...post,
    reactions,
    likes,
    gradient: meta.gradient,
    badge: meta.badge,
    authorEmoji: meta.authorEmoji,
    authorBg: meta.authorBg,
    tags: Array.isArray(post.tags) ? post.tags : JSON.parse(post.tags as string),
    categories: Array.isArray(post.categories) ? post.categories : JSON.parse(post.categories as string),
  };

  return NextResponse.json({ post: result });
}
