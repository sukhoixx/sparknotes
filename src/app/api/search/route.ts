import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LIMIT = 12;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const cursor = searchParams.get("cursor");

  if (!q) return NextResponse.json({ posts: [], nextCursor: null });

  const where = {
    OR: [
      { title: { contains: q, mode: "insensitive" as const } },
      { snippet: { contains: q, mode: "insensitive" as const } },
    ],
  };

  const posts = await prisma.post.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: LIMIT,
    ...(cursor ? { skip: 1, cursor: { id: parseInt(cursor) } } : {}),
  });

  const nextCursor = posts.length === LIMIT ? String(posts[posts.length - 1].id) : null;

  return NextResponse.json({ posts, nextCursor });
}
