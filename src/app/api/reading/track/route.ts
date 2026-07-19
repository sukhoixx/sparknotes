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

function localToday(tzOffsetMinutes: number): Date {
  // tzOffsetMinutes = client's new Date().getTimezoneOffset() (negative for UTC+)
  const now = new Date();
  const localMs = now.getTime() - tzOffsetMinutes * 60 * 1000;
  const local = new Date(localMs);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, tzOffset } = await req.json();
  if (!postId || typeof postId !== "number") {
    return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
  }

  const today = localToday(typeof tzOffset === "number" ? tzOffset : 0);

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
  // Use ReadingSession dates (not Activity) — streak = consecutive days with at least 1 article read
  const since = new Date(today);
  since.setDate(since.getDate() - 60);

  const sessions = await prisma.readingSession.findMany({
    where: { userId, date: { gte: since, lte: today } },
    orderBy: { date: "desc" },
    distinct: ["date"],
    select: { date: true },
  });

  if (sessions.length === 0) return 0;

  // Today must have a reading session for the streak to be active
  const todayMs = today.getTime();
  const hasTodaySession = sessions.some((s) => new Date(s.date).getTime() === todayMs);
  if (!hasTodaySession) return 0;

  let streak = 1;
  let cursor = new Date(today);
  cursor.setDate(cursor.getDate() - 1);

  for (const row of sessions.slice(1)) {
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
