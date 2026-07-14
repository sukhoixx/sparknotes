import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = body?.token as string | undefined;
  const platform = body?.platform as string | undefined;

  if (!token || !platform) {
    return NextResponse.json({ error: "Missing token or platform" }, { status: 400 });
  }

  await prisma.deviceToken.upsert({
    where: { token },
    update: { platform, updatedAt: new Date() },
    create: { token, platform },
  });

  return NextResponse.json({ ok: true });
}
