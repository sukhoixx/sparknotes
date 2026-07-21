import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/getAuthUserId";

function localToday(tzOffsetMinutes: number): Date {
  const now = new Date();
  const localMs = now.getTime() - tzOffsetMinutes * 60 * 1000;
  const local = new Date(localMs);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

// Returns the percentage of other users the given score beats (0–100, floored).
// Excludes the current user so they don't count against themselves.
// If no others exist and the user has a positive score, they beat the whole field.
function percentile(userScore: number, others: number[]): number {
  if (others.length === 0) return userScore > 0 ? 99 : 0;
  const beaten = others.filter((s) => userScore > s).length;
  return Math.floor((beaten / others.length) * 100);
}

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tzOffset = parseInt(req.nextUrl.searchParams.get("tz") ?? "0", 10);
  const today = localToday(isNaN(tzOffset) ? 0 : tzOffset);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6); // 7 days inclusive

  const since30 = new Date(today);
  since30.setDate(since30.getDate() - 29); // 30 days inclusive

  const [rewards, profile, dailyAll, weeklyAll, allTimeAll, userAllTimeAgg] = await Promise.all([
    prisma.dailyReward.findMany({
      where: { userId, date: { gte: since30, lte: today } },
      orderBy: { date: "desc" },
      select: { date: true, articlesRead: true, pointsEarned: true, multiplier: true, badge: true },
    }),
    prisma.userProfile.findUnique({
      where: { id: userId },
      select: { streak: true },
    }),
    // Daily: all users' points for today
    prisma.dailyReward.groupBy({
      by: ["userId"],
      where: { date: today, userId: { not: userId } },
      _sum: { pointsEarned: true },
    }),
    // Weekly: sum per user over last 7 days
    prisma.dailyReward.groupBy({
      by: ["userId"],
      where: { date: { gte: weekAgo, lte: today }, userId: { not: userId } },
      _sum: { pointsEarned: true },
    }),
    // All-time: sum per user across all history (others)
    prisma.dailyReward.groupBy({
      by: ["userId"],
      where: { userId: { not: userId } },
      _sum: { pointsEarned: true },
    }),
    // All-time: current user's true total (not capped at 30 days)
    prisma.dailyReward.aggregate({
      where: { userId },
      _sum: { pointsEarned: true },
    }),
  ]);

  const todayKey = today.toISOString().slice(0, 10);
  const todayRow = rewards.find((r) => new Date(r.date).toISOString().slice(0, 10) === todayKey);

  const userDailyPts = todayRow?.pointsEarned ?? 0;
  const userWeeklyPts = rewards
    .filter((r) => new Date(r.date) >= weekAgo)
    .reduce((s, r) => s + r.pointsEarned, 0);
  const userAllTimePts = userAllTimeAgg._sum.pointsEarned ?? 0;

  const rank = {
    daily: percentile(userDailyPts, dailyAll.map((r) => r._sum.pointsEarned ?? 0)),
    weekly: percentile(userWeeklyPts, weeklyAll.map((r) => r._sum.pointsEarned ?? 0)),
    allTime: percentile(userAllTimePts, allTimeAll.map((r) => r._sum.pointsEarned ?? 0)),
  };

  return NextResponse.json({ rewards, streak: profile?.streak ?? 0, rank });
}
