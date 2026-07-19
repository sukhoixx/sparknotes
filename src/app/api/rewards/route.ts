import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/getAuthUserId";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
