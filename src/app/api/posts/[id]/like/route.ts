import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/getAuthUserId";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const userId = await getAuthUserId();
  const body = await req.json().catch(() => ({}));
  const emoji: string = body.emoji ?? "❤️";

  if (userId) {
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId: id } },
      select: { emoji: true },
    });

    if (existing) {
      if (existing.emoji !== emoji) {
        await prisma.like.update({
          where: { userId_postId: { userId, postId: id } },
          data: { emoji },
        });
      }
      const post = await prisma.post.findUnique({ where: { id }, select: { likes: true } });
      return NextResponse.json({ likes: post?.likes ?? 0 });
    }

    await prisma.like.create({ data: { userId, postId: id, emoji } });
  }

  const post = await prisma.post.update({
    where: { id },
    data: { likes: { increment: 1 } },
    select: { likes: true },
  });

  return NextResponse.json({ likes: post.likes });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const userId = await getAuthUserId();

  if (userId) {
    const deleted = await prisma.like.deleteMany({ where: { userId, postId: id } });
    if (deleted.count === 0) {
      const post = await prisma.post.findUnique({ where: { id }, select: { likes: true } });
      return NextResponse.json({ likes: post?.likes ?? 0 });
    }
  }

  const post = await prisma.post.update({
    where: { id },
    data: { likes: { decrement: 1 } },
    select: { likes: true },
  });

  return NextResponse.json({ likes: post.likes });
}
