import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/getAuthUserId";

function localToday(tzOffsetMinutes: number): Date {
  const now = new Date();
  const localMs = now.getTime() - tzOffsetMinutes * 60 * 1000;
  const local = new Date(localMs);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tzOffset = parseInt(req.nextUrl.searchParams.get("tz") ?? "0", 10);
  const today = localToday(isNaN(tzOffset) ? 0 : tzOffset);

  const since = new Date(today);
  since.setDate(since.getDate() - 29); // 30 days inclusive

  const [rewards, profile] = await Promise.all([
    prisma.dailyReward.findMany({
      where: { userId, date: { gte: since, lte: today } },
      orderBy: { date: "desc" },
      select: { date: true, articlesRead: true, pointsEarned: true, multiplier: true, badge: true },
    }),
    prisma.userProfile.findUnique({
      where: { id: userId },
      select: { streak: true },
    }),
  ]);

  return NextResponse.json({ rewards, streak: profile?.streak ?? 0 });
}
