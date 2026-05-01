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

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("cursor") ?? "0");
  const category = searchParams.get("category") ?? "all";

  const where = category !== "all" ? { category } : {};
  const today = startOfToday();

  if (page === 0) {
    const total = await prisma.post.count({ where });
    if (total < LOW_THRESHOLD) triggerGeneration();
  }

  // How many today-pages come before older posts
  const todayCount = await prisma.post.count({ where: { ...where, publishedAt: { gte: today } } });
  const todayPages = Math.ceil(todayCount / LIMIT) || 0;

  let posts;
  if (page < todayPages || todayCount === 0) {
    // Serve today's posts
    posts = await prisma.post.findMany({
      where: { ...where, publishedAt: { gte: today } },
      orderBy: { id: "desc" },
      take: LIMIT,
      skip: page * LIMIT,
    });
  } else {
    // Today's posts exhausted — serve older posts
    const olderPage = page - todayPages;
    posts = await prisma.post.findMany({
      where: { ...where, publishedAt: { lt: today } },
      orderBy: { id: "desc" },
      take: LIMIT,
      skip: olderPage * LIMIT,
    });
  }

  const shuffled = posts.sort(() => Math.random() - 0.5);
  const nextCursor = posts.length === LIMIT ? String(page + 1) : null;

  return NextResponse.json({ posts: shuffled, nextCursor });
}
