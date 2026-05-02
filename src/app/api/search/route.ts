import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/ai";
import type { Category } from "@/lib/ai";

function applyMeta<T extends { category: string }>(posts: T[]): T[] {
  return posts.map((p) => {
    const meta = CATEGORY_META[p.category as Category];
    if (!meta) return p;
    return { ...p, gradient: meta.gradient, badge: meta.badge, authorEmoji: meta.authorEmoji, authorBg: meta.authorBg };
  });
}

const LIMIT = 12;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const page = parseInt(searchParams.get("cursor") ?? "0");

  if (!q) return NextResponse.json({ posts: [], nextCursor: null });

  const where = {
    OR: [
      { title: { contains: q } },
      { snippet: { contains: q } },
    ],
  };

  const posts = await prisma.post.findMany({
    where,
    orderBy: { id: "desc" },
    take: LIMIT,
    skip: page * LIMIT,
    include: { _count: { select: { comments: true } } },
  });

  const shuffled = applyMeta(posts.sort(() => Math.random() - 0.5));
  const nextCursor = posts.length === LIMIT ? String(page + 1) : null;

  return NextResponse.json({ posts: shuffled, nextCursor });
}
