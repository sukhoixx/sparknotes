import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/getAuthUserId";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ reactions: [] });

  const likes = await prisma.like.findMany({
    where: { userId },
    select: { postId: true, emoji: true },
  });

  return NextResponse.json({ reactions: likes.map((l) => ({ postId: l.postId, emoji: l.emoji })) });
}
