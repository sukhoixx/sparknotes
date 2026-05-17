import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/ai";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalPosts,
    postsLast24h,
    postsLast7d,
    postsByCategory,
    totalUsers,
    activeUsersLast7d,
    langDist,
    allProfiles,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.post.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.post.groupBy({ by: ["category"], _count: { _all: true }, orderBy: { _count: { id: "desc" } } }),
    prisma.userProfile.count(),
    prisma.userProfile.count({ where: { updatedAt: { gte: sevenDaysAgo } } }),
    prisma.userProfile.groupBy({ by: ["lang"], _count: { _all: true } }),
    prisma.userProfile.findMany({ select: { categories: true } }),
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

  return NextResponse.json({
    posts: {
      total: totalPosts,
      last24h: postsLast24h,
      last7d: postsLast7d,
      byCategory: Object.fromEntries(postsByCategory.map((r) => [r.category, r._count._all])),
    },
    users: {
      total: totalUsers,
      activeLast7d: activeUsersLast7d,
      byLang: Object.fromEntries(langDist.map((r) => [r.lang ?? "en", r._count._all])),
      byCategory: catCounts,
    },
  });
}
