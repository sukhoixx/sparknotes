import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const postId = parseInt(params.id);
  if (isNaN(postId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const postId = parseInt(params.id);
  if (isNaN(postId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { text } = await req.json();
  const trimmed = (text ?? "").trim().slice(0, 500);
  if (!trimmed) return NextResponse.json({ error: "Empty comment" }, { status: 400 });

  const comment = await prisma.comment.create({
    data: { postId, text: trimmed },
  });

  return NextResponse.json({ comment });
}
