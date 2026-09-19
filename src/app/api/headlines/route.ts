import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const row = await prisma.dailyHeadlines.findFirst({
    orderBy: { generatedAt: "desc" },
    select: { headlines: true, headlinesZh: true, headlinesCn: true, postIds: true, generatedAt: true },
  });

  if (!row) return NextResponse.json({ headlines: [], headlinesZh: [], headlinesCn: [], postIds: [], generatedAt: null });
  return NextResponse.json({ headlines: row.headlines, headlinesZh: row.headlinesZh, headlinesCn: row.headlinesCn, postIds: row.postIds ?? [], generatedAt: row.generatedAt });
}
