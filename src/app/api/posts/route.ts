import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LIMIT = 12;
const LOW_THRESHOLD = 15;

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
  const page = parseInt(searchParams.get("cursor") ?? "0");
  const category = searchParams.get("category") ?? "all";

  const where = category !== "all" ? { category } : {};

  if (page === 0) {
    const total = await prisma.post.count({ where });
    if (total < LOW_THRESHOLD) triggerGeneration();
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { id: "desc" },
    take: LIMIT,
    skip: page * LIMIT,
  });

  // Shuffle within each page for a randomized feel
  const shuffled = posts.sort(() => Math.random() - 0.5);
  const nextCursor = posts.length === LIMIT ? String(page + 1) : null;

  return NextResponse.json({ posts: shuffled, nextCursor });
}
