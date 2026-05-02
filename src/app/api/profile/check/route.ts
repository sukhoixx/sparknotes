import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  const deviceId = req.nextUrl.searchParams.get("deviceId") ?? "";

  if (name.length < 2) return NextResponse.json({ available: false });

  const existing = await prisma.userProfile.findUnique({ where: { screenName: name } });
  const available = !existing || existing.id === deviceId;

  return NextResponse.json({ available });
}
