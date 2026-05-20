import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/ai";
import { FEEDS } from "@/lib/rss";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    totalPosts,
    postsLast24h,
    postsLast7d,
    postsByCategory,
    postsLast24hByCategory,
    totalUsers,
    langDist,
    allProfiles,
    dauRows,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.post.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.post.groupBy({ by: ["category"], _count: { _all: true }, orderBy: { _count: { id: "desc" } } }),
    prisma.post.groupBy({ by: ["category"], where: { createdAt: { gte: oneDayAgo } }, _count: { _all: true } }),
    prisma.userProfile.count(),
    prisma.userProfile.groupBy({ by: ["lang"], _count: { _all: true } }),
    prisma.userProfile.findMany({ select: { categories: true } }),
    prisma.activity.groupBy({
      by: ["date"],
      where: { date: { gte: fourteenDaysAgo } },
      _count: { userId: true },
      orderBy: { date: "asc" },
    }),
  ]);

  // Count subscribers per category by unnesting categories JSON arrays
  const catCounts: Record<string, number> = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const profile of allProfiles) {
    const cats: string[] = Array.isArray(profile.categories)
      ? profile.categories
      : typeof profile.categories === "string"
        ? JSON.parse(profile.categories)
        : [];
    for (const cat of cats) {
      if (cat in catCounts) catCounts[cat]++;
    }
  }

  const dauMap = Object.fromEntries(
    dauRows.map((r) => [new Date(r.date).toISOString().slice(0, 10), r._count.userId])
  );
  const dau = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(fourteenDaysAgo);
    d.setDate(d.getDate() + i + 1);
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: dauMap[key] ?? 0 };
  });

  const feedSources = Object.fromEntries(
    Object.entries(FEEDS).map(([cat, sources]) => [cat, sources.map((s) => s.source)])
  );

  return NextResponse.json({
    posts: {
      total: totalPosts,
      last24h: postsLast24h,
      last7d: postsLast7d,
      byCategory: Object.fromEntries(postsByCategory.map((r) => [r.category, r._count._all])),
      last24hByCategory: Object.fromEntries(postsLast24hByCategory.map((r) => [r.category, r._count._all])),
    },
    feeds: feedSources,
    users: {
      total: totalUsers,
      byLang: Object.fromEntries(langDist.map((r) => [r.lang ?? "en", r._count._all])),
      byCategory: catCounts,
      dau,
    },
  });
}
