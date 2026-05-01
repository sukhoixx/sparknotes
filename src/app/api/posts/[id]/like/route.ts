import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

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

  const post = await prisma.post.update({
    where: { id },
    data: { likes: { decrement: 1 } },
    select: { likes: true },
  });

  return NextResponse.json({ likes: post.likes });
}
