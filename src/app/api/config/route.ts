import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.activeEvent.findMany({ orderBy: { updatedAt: "desc" } }).catch(() => []);

  return NextResponse.json({
    minVersion: process.env.MIN_APP_VERSION ?? "1.0.0",
    minVersionIos: process.env.MIN_APP_VERSION_IOS ?? process.env.MIN_APP_VERSION ?? "1.0.0",
    minVersionAndroid: process.env.MIN_APP_VERSION_ANDROID ?? process.env.MIN_APP_VERSION ?? "1.0.0",
    adFrequency: parseInt(process.env.AD_FREQUENCY ?? "10", 10),
    activeEvents: rows.map((e) => ({ slot: e.id, slug: e.slug, label: e.label, labelZh: e.labelZh ?? null, description: e.description })),
  });
}
