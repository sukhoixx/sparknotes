import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, CATEGORY_META } from "@/lib/ai";
import type { Category } from "@/lib/ai";


type MappedPost = ReturnType<typeof mapRaw>[number];

// Sort by recency, then shuffle posts within 3-hour windows so the feed
// varies on each refresh while older posts never leapfrog newer ones.
const BUCKET_MS = 3 * 60 * 60 * 1000;
function bucketShuffle(posts: MappedPost[]): MappedPost[] {
  const sorted = [...posts].sort((a, b) => b.id - a.id);
  const result: MappedPost[] = [];
  let i = 0;
  while (i < sorted.length) {
    const bucketStart = sorted[i].createdAt.getTime();
    let j = i + 1;
    while (j < sorted.length && bucketStart - sorted[j].createdAt.getTime() < BUCKET_MS) j++;
    const bucket = sorted.slice(i, j).sort(() => Math.random() - 0.5);
    result.push(...bucket);
    i = j;
  }
  return result;
}

function applyMeta<T extends { category: string }>(posts: T[]): T[] {
  return posts.map((p) => {
    const meta = CATEGORY_META[p.category as Category];
    if (!meta) return p;
    return { ...p, gradient: meta.gradient, badge: meta.badge, authorEmoji: meta.authorEmoji, authorBg: meta.authorBg };
  });
}

const LIMIT = 10;
const LOW_THRESHOLD = 15;

// Backfill categories for posts that predate multi-category support — runs once per process
let backfillDone = false;
async function ensureCategoriesBackfill() {
  if (backfillDone) return;
  backfillDone = true;
  await prisma.$executeRaw`
    UPDATE \`Post\` SET categories = JSON_ARRAY(category)
    WHERE categories IS NULL OR JSON_LENGTH(categories) = 0
  `;
}

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

type RawRow = {
  id: number; title: string; snippet: string; body: string; funFact: string;
  tags: unknown; categories: unknown; category: string; emoji: string; gradient: string;
  badge: string; authorEmoji: string; authorBg: string; sourceUrl: string | null;
  imageUrl: string | null; likes: number; publishedAt: Date; createdAt: Date;
  commentCount: bigint; rn?: bigint;
  zhTitle: string | null; zhSnippet: string | null; zhBody: string | null; zhFunFact: string | null;
  zhTitleCn: string | null; zhSnippetCn: string | null; zhBodyCn: string | null; zhFunFactCn: string | null;
};

function mapRaw(rows: RawRow[], activeCats?: string[]) {
  return rows.map(({ commentCount, categories: rawCats, rn: _rn, ...p }) => {
    const cats: string[] = Array.isArray(rawCats)
      ? rawCats
      : typeof rawCats === "string"
        ? JSON.parse(rawCats)
        : [p.category];

    const displayCategory = cats[0] ?? p.category;

    const categoryEmojis = cats
      .map((c) => CATEGORY_META[c as Category]?.emoji)
      .filter(Boolean)
      .join("") || CATEGORY_META[displayCategory as Category]?.emoji || p.emoji;

    return {
      ...p,
      category: displayCategory,
      categoryEmojis,
      tags: Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags as string),
      _count: { comments: Number(commentCount) },
    };
  });
}

export async function GET(req: NextRequest) {
  ensureCategoriesBackfill().catch(() => {});
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("cursor") ?? "0");
  const category = searchParams.get("category") ?? "all";
  const catsParam = searchParams.get("cats");
  const q = searchParams.get("q")?.trim() ?? "";
  const eventSlug = searchParams.get("event") ?? "";
  const today = startOfToday();

  // Event feed path — all posts for a specific event slug
  if (eventSlug) {
    const posts = applyMeta(await prisma.post.findMany({
      where: { eventSlug },
      orderBy: { id: "desc" },
      take: LIMIT,
      skip: page * LIMIT,
      include: { _count: { select: { comments: true } } },
    }));
    return NextResponse.json({ posts, nextCursor: posts.length === LIMIT ? String(page + 1) : null });
  }

  // Search path — simple full-text filter across all posts
  if (q) {
    const posts = applyMeta(await prisma.post.findMany({
      where: { OR: [{ title: { contains: q } }, { snippet: { contains: q } }, { zhTitle: { contains: q } }, { zhSnippet: { contains: q } }] },
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
    const raw = await prisma.$queryRaw<RawRow[]>`
      SELECT p.id, p.title, p.snippet, p.body, p.funFact, p.tags, p.categories, p.category,
             p.emoji, p.gradient, p.badge, p.authorEmoji, p.authorBg,
             p.sourceUrl, p.imageUrl, p.likes, p.publishedAt, p.createdAt,
             p.zhTitle, p.zhSnippet, p.zhBody, p.zhFunFact,
             p.zhTitleCn, p.zhSnippetCn, p.zhBodyCn, p.zhFunFactCn,
             (SELECT COUNT(*) FROM \`Comment\` c WHERE c.postId = p.id) AS commentCount
      FROM \`Post\` p
      WHERE p.eventSlug IS NULL
        AND JSON_OVERLAPS(
          IF(p.categories IS NULL OR JSON_LENGTH(p.categories) = 0, JSON_ARRAY(p.category), p.categories),
          CAST(${JSON.stringify(activeCats)} AS JSON))
      ORDER BY p.id DESC
      LIMIT ${LIMIT} OFFSET ${page * LIMIT}
    `;
    posts = mapRaw(raw as RawRow[], activeCats);
  } else {
    // Single category tab — filter by categories array so cross-tagged posts appear
    const [{ n: todayCount }] = await prisma.$queryRaw<[{ n: bigint }]>`
      SELECT COUNT(*) AS n FROM \`Post\` p
      WHERE p.publishedAt >= ${today}
        AND p.eventSlug IS NULL
        AND JSON_CONTAINS(
          IF(p.categories IS NULL OR JSON_LENGTH(p.categories) = 0, JSON_ARRAY(p.category), p.categories),
          JSON_QUOTE(${category}))
    `;
    const todayPages = Math.ceil(Number(todayCount) / LIMIT) || 0;

    const selectCols = Prisma.sql`
      p.id, p.title, p.snippet, p.body, p.funFact, p.tags, p.categories, p.category,
      p.emoji, p.gradient, p.badge, p.authorEmoji, p.authorBg,
      p.sourceUrl, p.imageUrl, p.likes, p.publishedAt, p.createdAt,
      p.zhTitle, p.zhSnippet, p.zhBody, p.zhFunFact,
      p.zhTitleCn, p.zhSnippetCn, p.zhBodyCn, p.zhFunFactCn,
      (SELECT COUNT(*) FROM \`Comment\` c WHERE c.postId = p.id) AS commentCount
    `;
    const catFilter = Prisma.sql`JSON_CONTAINS(
      IF(p.categories IS NULL OR JSON_LENGTH(p.categories) = 0, JSON_ARRAY(p.category), p.categories),
      JSON_QUOTE(${category}))`;

    if (Number(todayCount) > 0 && page < todayPages) {
      const raw = await prisma.$queryRaw<RawRow[]>`
        SELECT ${selectCols} FROM \`Post\` p
        WHERE p.publishedAt >= ${today} AND p.eventSlug IS NULL AND ${catFilter}
        ORDER BY p.id DESC LIMIT ${LIMIT} OFFSET ${page * LIMIT}
      `;
      posts = mapRaw(raw);
    } else {
      const olderPage = Number(todayCount) > 0 ? page - todayPages : page;
      const raw = await prisma.$queryRaw<RawRow[]>`
        SELECT ${selectCols} FROM \`Post\` p
        WHERE p.publishedAt < ${today} AND p.eventSlug IS NULL AND ${catFilter}
        ORDER BY p.id DESC LIMIT ${LIMIT} OFFSET ${olderPage * LIMIT}
      `;
      posts = mapRaw(raw);
    }

  }

  const nextCursor = posts.length > 0 ? String(page + 1) : null;
  posts = applyMeta(posts);

  return NextResponse.json({ posts, nextCursor });
}
