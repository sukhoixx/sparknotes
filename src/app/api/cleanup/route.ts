import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let isRunning = false;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-generate-secret");
  if (secret !== process.env.GENERATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "7");
  if (isNaN(days) || days < 7) {
    return NextResponse.json({ error: "days must be >= 7" }, { status: 400 });
  }

  if (isRunning) {
    return NextResponse.json({ message: "Cleanup already in progress" });
  }

  isRunning = true;

  (async () => {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const { count } = await prisma.post.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });
      console.log(`[cleanup] deleted ${count} posts older than ${days} days`);
    } catch (err) {
      console.error("[cleanup] error:", err);
    } finally {
      isRunning = false;
    }
  })();

  return NextResponse.json({ message: `Cleanup started (posts older than ${days} days)` });
}
