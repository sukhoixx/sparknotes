import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/getAuthUserId";

const BADGE_THRESHOLDS = [
  { min: 40, badge: "diamond" },
  { min: 30, badge: "gold" },
  { min: 20, badge: "silver" },
  { min: 10, badge: "bronze" },
] as const;

function getBadge(count: number): string | null {
  return BADGE_THRESHOLDS.find((t) => count >= t.min)?.badge ?? null;
}

function getMultiplier(streak: number): number {
  if (streak >= 14) return 2;
  if (streak >= 7) return 1.5;
  return 1;
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId } = await req.json();
  if (!postId || typeof postId !== "number") {
    return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Try to insert a ReadingSession — unique constraint prevents duplicates
  let isNew = false;
  try {
    await prisma.readingSession.create({ data: { userId, postId, date: today } });
    isNew = true;
  } catch {
    // Already recorded today — idempotent, return current state
  }

  // Compute today's article count for this user
  const todayCount = await prisma.readingSession.count({ where: { userId, date: today } });

  // Compute streak: count consecutive days with Activity rows ending today
  const streak = await computeStreak(userId, today);

  // Update UserProfile streak
  await prisma.userProfile.updateMany({
    where: { id: userId },
    data: { streak, streakUpdatedAt: new Date() },
  });

  const multiplier = getMultiplier(streak);
  const badge = getBadge(todayCount);
  const pointsEarned = parseFloat((todayCount * multiplier).toFixed(2));

  // Upsert the DailyReward summary row
  await prisma.dailyReward.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, articlesRead: todayCount, pointsEarned, multiplier, badge },
    update: { articlesRead: todayCount, pointsEarned, multiplier, badge },
  });

  return NextResponse.json({ isNew, todayCount, streak, multiplier, badge, pointsEarned });
}

async function computeStreak(userId: string, today: Date): Promise<number> {
  // Fetch last 60 days of activity to find the streak
  const since = new Date(today);
  since.setDate(since.getDate() - 60);

  const activities = await prisma.activity.findMany({
    where: { userId, date: { gte: since, lte: today } },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (activities.length === 0) return 0;

  // Check today is present (profile GET upserts it on app load, but track may fire before)
  const todayMs = today.getTime();
  const hasTodayActivity = activities.some((a) => new Date(a.date).getTime() === todayMs);
  if (!hasTodayActivity) return 0;

  let streak = 1;
  let cursor = new Date(today);
  cursor.setDate(cursor.getDate() - 1);

  for (const row of activities.slice(1)) {
    const rowMs = new Date(row.date).getTime();
    const cursorMs = cursor.getTime();
    if (rowMs === cursorMs) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (rowMs < cursorMs) {
      break;
    }
  }

  return streak;
}
