import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LIMIT = 12;
const LOW_THRESHOLD = 15; // trigger generation if total posts < this

function triggerGeneration() {
  const base = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : "http://localhost:3000";

  fetch(`${base}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-generate-secret": process.env.GENERATE_SECRET ?? "",
    },
  }).catch(() => {/* intentionally ignored */});
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const category = searchParams.get("category") ?? "all";

  const where = category !== "all" ? { category } : {};

  // On first page, check if we need more posts
  if (!cursor) {
    const total = await prisma.post.count({ where });
    if (total < LOW_THRESHOLD) {
      triggerGeneration();
    }
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: LIMIT,
    ...(cursor ? { skip: 1, cursor: { id: parseInt(cursor) } } : {}),
  });

  const nextCursor = posts.length === LIMIT ? String(posts[posts.length - 1].id) : null;

  return NextResponse.json({ posts, nextCursor });
}
