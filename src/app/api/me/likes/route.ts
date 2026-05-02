import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/getAuthUserId";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ likedPostIds: [] });

  const likes = await prisma.like.findMany({
    where: { userId },
    select: { postId: true },
  });

  return NextResponse.json({ likedPostIds: likes.map((l) => l.postId) });
}
