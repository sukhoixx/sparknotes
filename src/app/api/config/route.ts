import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const activeEvent = await prisma.activeEvent.findUnique({ where: { id: 1 } }).catch(() => null);

  return NextResponse.json({
    minVersion: process.env.MIN_APP_VERSION ?? "1.0.0",
    activeEvent: activeEvent
      ? { slug: activeEvent.slug, label: activeEvent.label, labelZh: activeEvent.labelZh ?? null, description: activeEvent.description }
      : null,
  });
}
