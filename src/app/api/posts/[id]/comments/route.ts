import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/getAuthUserId";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const postId = parseInt(params.id);
  if (isNaN(postId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    select: { id: true, text: true, screenName: true, createdAt: true },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const postId = parseInt(params.id);
  if (isNaN(postId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { text } = await req.json();
  const trimmedText = (text ?? "").trim().slice(0, 500);
  if (!trimmedText) return NextResponse.json({ error: "Empty comment" }, { status: 400 });

  // Resolve screen name server-side from the user's profile
  const userId = await getAuthUserId();
  let screenName = "Anonymous";
  if (userId) {
    const profile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: { screenName: true },
    });
    if (profile) screenName = profile.screenName;
  }

  const comment = await prisma.comment.create({
    data: { postId, text: trimmedText, screenName },
    select: { id: true, text: true, screenName: true, createdAt: true },
  });

  return NextResponse.json({ comment });
}
