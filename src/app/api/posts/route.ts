import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LIMIT = 12;
const LOW_THRESHOLD = 8;

// Fire-and-forget background generation
function triggerGeneration() {
  const base = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
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

  // Check if we should generate more posts (only on first page)
  if (!cursor) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayCount = await prisma.post.count({
      where: { publishedAt: { gte: startOfToday } },
    });
    if (todayCount < LOW_THRESHOLD) {
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
