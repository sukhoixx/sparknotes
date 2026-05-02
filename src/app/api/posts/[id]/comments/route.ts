import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  const { text, screenName } = await req.json();
  const trimmedText = (text ?? "").trim().slice(0, 500);
  const trimmedName = (screenName ?? "Anonymous").trim().slice(0, 50) || "Anonymous";

  if (!trimmedText) return NextResponse.json({ error: "Empty comment" }, { status: 400 });

  const comment = await prisma.comment.create({
    data: { postId, text: trimmedText, screenName: trimmedName },
    select: { id: true, text: true, screenName: true, createdAt: true },
  });

  return NextResponse.json({ comment });
}
