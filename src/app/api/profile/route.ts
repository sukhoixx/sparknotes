import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) return NextResponse.json({ profile: null });

  const row = await prisma.userProfile.findUnique({
    where: { id: deviceId },
    select: { screenName: true, categories: true },
  });

  return NextResponse.json({ profile: row ?? null });
}

export async function POST(req: NextRequest) {
  const { deviceId, screenName, categories } = await req.json();

  if (!deviceId || typeof screenName !== "string" || !Array.isArray(categories)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const trimmed = screenName.trim().slice(0, 50);
  if (trimmed.length < 2) {
    return NextResponse.json({ error: "Screen name must be at least 2 characters" }, { status: 400 });
  }
  if (categories.length < 3) {
    return NextResponse.json({ error: "Select at least 3 categories" }, { status: 400 });
  }

  const existing = await prisma.userProfile.findUnique({ where: { screenName: trimmed } });
  if (existing && existing.id !== deviceId) {
    return NextResponse.json({ error: "Screen name already taken" }, { status: 409 });
  }

  const profile = await prisma.userProfile.upsert({
    where: { id: deviceId },
    create: { id: deviceId, screenName: trimmed, categories },
    update: { screenName: trimmed, categories },
    select: { screenName: true, categories: true },
  });

  return NextResponse.json({ profile });
}
