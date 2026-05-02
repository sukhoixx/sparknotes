import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/ai";

const LIMIT = 12;
const PER_CATEGORY = 3; // 3 × 4 categories = 12 per page
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
  }).catch(() => {});
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
  const today = startOfToday();

  if (page === 0) {
    const total = await prisma.post.count();
    if (total < LOW_THRESHOLD) triggerGeneration();
  }

  let posts;

  if (category === "all") {
    // Fetch proportionally from each category to guarantee a mixed feed
    const perCatResults = await Promise.all(
      CATEGORIES.map(async (cat) => {
        // Today's posts first
        const todayPosts = await prisma.post.findMany({
          where: { category: cat, publishedAt: { gte: today } },
          orderBy: { id: "desc" },
          take: PER_CATEGORY,
          skip: page * PER_CATEGORY,
          include: { _count: { select: { comments: true } } },
        });
        if (todayPosts.length === PER_CATEGORY) return todayPosts;

        // Fill remainder from older posts
        const todayCount = await prisma.post.count({ where: { category: cat, publishedAt: { gte: today } } });
        const todayPages = Math.ceil(todayCount / PER_CATEGORY);
        const olderPage = Math.max(0, page - todayPages);
        const older = await prisma.post.findMany({
          where: { category: cat, publishedAt: { lt: today } },
          orderBy: { id: "desc" },
          take: PER_CATEGORY - todayPosts.length,
          skip: olderPage * (PER_CATEGORY - todayPosts.length),
          include: { _count: { select: { comments: true } } },
        });
        return [...todayPosts, ...older];
      })
    );

    posts = perCatResults.flat().sort(() => Math.random() - 0.5);
  } else {
    // Single category — today first, then older
    const todayCount = await prisma.post.count({ where: { category, publishedAt: { gte: today } } });
    const todayPages = Math.ceil(todayCount / LIMIT) || 0;

    if (todayCount > 0 && page < todayPages) {
      posts = await prisma.post.findMany({
        where: { category, publishedAt: { gte: today } },
        orderBy: { id: "desc" },
        take: LIMIT,
        skip: page * LIMIT,
        include: { _count: { select: { comments: true } } },
      });
    } else {
      const olderPage = todayCount > 0 ? page - todayPages : page;
      posts = await prisma.post.findMany({
        where: { category, publishedAt: { lt: today } },
        orderBy: { id: "desc" },
        take: LIMIT,
        skip: olderPage * LIMIT,
        include: { _count: { select: { comments: true } } },
      });
    }

    posts = posts.sort(() => Math.random() - 0.5);
  }

  const nextCursor = posts.length > 0 ? String(page + 1) : null;

  return NextResponse.json({ posts, nextCursor });
}
