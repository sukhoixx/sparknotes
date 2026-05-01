import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  });

  const shuffled = posts.sort(() => Math.random() - 0.5);
  const nextCursor = posts.length === LIMIT ? String(page + 1) : null;

  return NextResponse.json({ posts: shuffled, nextCursor });
}
