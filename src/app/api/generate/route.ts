import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchRecentArticles } from "@/lib/rss";
import { summarizeArticle } from "@/lib/ai";

const MAX_POSTS_PER_RUN = 20;

let isRunning = false;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-generate-secret");
  if (secret !== process.env.GENERATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRunning) {
    return NextResponse.json({ message: "Generation already in progress" });
  }

  isRunning = true;
  let generated = 0;
  const errors: string[] = [];

  try {
    const articles = await fetchRecentArticles();
    const toProcess = articles.slice(0, MAX_POSTS_PER_RUN);

    // Check which source URLs are already in the DB to avoid duplicates
    const existingUrls = new Set(
      (await prisma.post.findMany({ select: { sourceUrl: true } }))
        .map((p) => p.sourceUrl)
        .filter(Boolean) as string[]
    );

    for (const article of toProcess) {
      if (existingUrls.has(article.link)) continue;

      const post = await summarizeArticle(article);
      if (!post) {
        errors.push(`Failed to summarize: ${article.title}`);
        continue;
      }

      await prisma.post.create({
        data: {
          title: post.title,
          snippet: post.snippet,
          body: post.body,
          funFact: post.funFact,
          tags: post.tags,
          category: post.category,
          emoji: post.emoji,
          gradient: post.gradient,
          badge: post.badge,
          authorEmoji: post.authorEmoji,
          authorBg: post.authorBg,
          sourceUrl: post.sourceUrl,
        },
      });

      generated++;
    }
  } catch (err) {
    isRunning = false;
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  isRunning = false;
  return NextResponse.json({ generated, errors });
}
