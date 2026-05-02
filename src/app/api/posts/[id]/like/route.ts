import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/getAuthUserId";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const userId = await getAuthUserId();

  if (userId) {
    // For authenticated users: enforce one like per user via the Like table
    try {
      await prisma.like.create({ data: { userId, postId: id } });
    } catch {
      // Already liked — return current count without incrementing
      const post = await prisma.post.findUnique({ where: { id }, select: { likes: true } });
      return NextResponse.json({ likes: post?.likes ?? 0 });
    }
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
      // Wasn't liked — return current count without decrementing
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
