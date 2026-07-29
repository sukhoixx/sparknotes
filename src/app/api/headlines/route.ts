import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const row = await prisma.dailyHeadlines.findFirst({
    orderBy: { generatedAt: "desc" },
    select: { headlines: true, headlinesZh: true, headlinesCn: true, generatedAt: true },
  });

  if (!row) return NextResponse.json({ headlines: [], headlinesZh: [], headlinesCn: [], generatedAt: null });
  return NextResponse.json({ headlines: row.headlines, headlinesZh: row.headlinesZh, headlinesCn: row.headlinesCn, generatedAt: row.generatedAt });
}
