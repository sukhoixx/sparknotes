import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/getAuthUserId";

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim() ?? "";

  if (name.length < 2) return NextResponse.json({ available: false });

  const userId = await getAuthUserId();
  const existing = await prisma.userProfile.findUnique({ where: { screenName: name } });
  const available = !existing || existing.id === userId;

  return NextResponse.json({ available });
}
