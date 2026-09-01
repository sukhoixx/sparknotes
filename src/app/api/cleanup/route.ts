import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const g = globalThis as typeof globalThis & { __cleanupRunning?: boolean };
function isRunning() { return g.__cleanupRunning ?? false; }
function setRunning(v: boolean) { g.__cleanupRunning = v; }

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-generate-secret");
  if (secret !== process.env.GENERATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "7");
  if (isNaN(days) || days < 7) {
    return NextResponse.json({ error: "days must be >= 7" }, { status: 400 });
  }

  if (isRunning()) {
    return NextResponse.json({ message: "Cleanup already in progress" });
  }

  setRunning(true);

  (async () => {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const [{ count: postCount }, { count: sessionCount }] = await Promise.all([
        prisma.post.deleteMany({ where: { createdAt: { lt: cutoff } } }),
        prisma.session.deleteMany({ where: { expires: { lt: new Date() } } }),
      ]);
      console.log(`[cleanup] deleted ${postCount} posts older than ${days} days, ${sessionCount} expired sessions`);
    } catch (err) {
      console.error("[cleanup] error:", err);
    } finally {
      setRunning(false);
    }
  })();

  return NextResponse.json({ message: `Cleanup started (posts older than ${days} days)` });
}
