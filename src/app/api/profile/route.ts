import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/getAuthUserId";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ profile: null });

  const row = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { screenName: true, categories: true, lang: true },
  });

  return NextResponse.json({ profile: row ?? null });
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { screenName, categories, lang } = await req.json();

  const trimmed = (screenName ?? "").trim().slice(0, 50);
  if (trimmed.length < 2) {
    return NextResponse.json({ error: "Screen name must be at least 2 characters" }, { status: 400 });
  }
  if (!Array.isArray(categories) || categories.length < 3) {
    return NextResponse.json({ error: "Select at least 3 categories" }, { status: 400 });
  }

  const existing = await prisma.userProfile.findUnique({ where: { screenName: trimmed } });
  if (existing && existing.id !== userId) {
    return NextResponse.json({ error: "Screen name already taken" }, { status: 409 });
  }

  const validLang = ["en", "zh-TW", "zh-CN"].includes(lang) ? lang : "en";
  const profile = await prisma.userProfile.upsert({
    where: { id: userId },
    create: { id: userId, screenName: trimmed, categories, lang: validLang },
    update: { screenName: trimmed, categories, lang: validLang },
    select: { screenName: true, categories: true, lang: true },
  });

  return NextResponse.json({ profile });
}
