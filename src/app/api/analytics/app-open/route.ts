import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.appOpenLog.upsert({
    where: { date: today },
    update: { count: { increment: 1 } },
    create: { date: today, count: 1 },
  });

  return NextResponse.json({ ok: true });
}
