import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateHeadlines } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-generate-secret");
  if (secret !== process.env.GENERATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const posts = await prisma.post.findMany({
    where: { createdAt: { gte: since } },
    select: { title: true, snippet: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  if (posts.length === 0) {
    return NextResponse.json({ error: "No posts in the last 24 hours" }, { status: 400 });
  }

  const headlines = await generateHeadlines(posts.map((p) => ({
    title: p.title,
    snippet: p.snippet,
    category: p.category,
  })));

  if (!headlines || headlines.headlines.length === 0) {
    return NextResponse.json({ error: "Failed to generate headlines" }, { status: 500 });
  }

  await prisma.dailyHeadlines.create({ data: { headlines: headlines.headlines, headlinesZh: headlines.headlinesZh, headlinesCn: headlines.headlinesCn } });

  return NextResponse.json({ headlines: headlines.headlines, headlinesZh: headlines.headlinesZh, headlinesCn: headlines.headlinesCn, count: headlines.headlines.length });
}
