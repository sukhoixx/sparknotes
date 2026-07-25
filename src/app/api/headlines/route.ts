import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const row = await prisma.dailyHeadlines.findFirst({
    orderBy: { generatedAt: "desc" },
    select: { headlines: true, generatedAt: true },
  });

  if (!row) return NextResponse.json({ headlines: [], generatedAt: null });
  return NextResponse.json({ headlines: row.headlines, generatedAt: row.generatedAt });
}
