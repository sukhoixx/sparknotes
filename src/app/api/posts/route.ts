import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, CATEGORY_META } from "@/lib/ai";
import type { Category } from "@/lib/ai";

function applyMeta<T extends { category: string }>(posts: T[]): T[] {
  return posts.map((p) => {
    const meta = CATEGORY_META[p.category as Category];
    if (!meta) return p;
    return { ...p, gradient: meta.gradient, badge: meta.badge, authorEmoji: meta.authorEmoji, authorBg: meta.authorBg };
  });
}

const LIMIT = 12;
const PER_CATEGORY = 2; // 2 × 8 categories = 16 per page
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
  const catsParam = searchParams.get("cats");
  const q = searchParams.get("q")?.trim() ?? "";
  const today = startOfToday();

  // Search path — simple full-text filter across all posts
  if (q) {
    const posts = applyMeta(await prisma.post.findMany({
      where: { OR: [{ title: { contains: q } }, { snippet: { contains: q } }] },
      orderBy: { id: "desc" },
      take: LIMIT,
      skip: page * LIMIT,
      include: { _count: { select: { comments: true } } },
    }));
    return NextResponse.json({ posts, nextCursor: posts.length > 0 ? String(page + 1) : null });
  }

  if (page === 0) {
    const total = await prisma.post.count();
    if (total < LOW_THRESHOLD) triggerGeneration();
  }

  // Preferred categories for personalised "For You" feed
  const activeCats: Category[] = (
    catsParam
      ? catsParam.split(",").filter((c) => (CATEGORIES as readonly string[]).includes(c)) as Category[]
      : [...CATEGORIES]
  );

  let posts;

  if (category === "all") {
    // Fetch proportionally from each category to guarantee a mixed feed
    const perCatResults = await Promise.all(
      activeCats.map(async (cat) => {
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
  posts = applyMeta(posts);

  return NextResponse.json({ posts, nextCursor });
}
