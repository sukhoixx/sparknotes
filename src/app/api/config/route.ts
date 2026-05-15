import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.activeEvent.findMany({ orderBy: { id: "desc" } }).catch(() => []);

  return NextResponse.json({
    minVersion: process.env.MIN_APP_VERSION ?? "1.0.0",
    activeEvents: rows.map((e) => ({ slug: e.slug, label: e.label, labelZh: e.labelZh ?? null, description: e.description })),
  });
}
