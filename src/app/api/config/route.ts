import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const activeEvent = await prisma.activeEvent.findUnique({ where: { id: 1 } }).catch(() => null);

  return NextResponse.json({
    minVersion: process.env.MIN_APP_VERSION ?? "1.0.0",
    activeEvent: activeEvent
      ? { slug: activeEvent.slug, label: activeEvent.label, description: activeEvent.description }
      : null,
  });
}
