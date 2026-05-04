import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchArticlesByCategory } from "@/lib/rss";
import { summarizeArticle, CATEGORIES } from "@/lib/ai";
import type { Category } from "@/lib/ai";

const NEW_PER_RUN = 20;

let isRunning = false;

async function runGeneration() {
  try {
    // Get existing source URLs to avoid duplicates
    const existing = await prisma.post.findMany({ select: { sourceUrl: true } });
    const existingUrls = new Set(existing.map((p) => p.sourceUrl).filter(Boolean) as string[]);

    for (const category of CATEGORIES) {
      console.log(`[generate] ${category}: generating ${NEW_PER_RUN} new posts`);

      const articles = await fetchArticlesByCategory(category as Category, 14);
      const fresh = articles.filter((a) => !existingUrls.has(a.link));

      let generated = 0;
      for (const article of fresh) {
        if (generated >= NEW_PER_RUN) break;

        const post = await summarizeArticle(article, category as Category);
        if (!post) continue;

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

        existingUrls.add(article.link);
        generated++;
        console.log(`[generate] ${category}: +1 (${generated}/${NEW_PER_RUN})`);
      }

      console.log(`[generate] ${category}: done (${generated} generated)`);
    }
  } catch (err) {
    console.error("[generate] error:", err);
  } finally {
    isRunning = false;
    console.log("[generate] done");
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-generate-secret");
  if (secret !== process.env.GENERATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRunning) {
    return NextResponse.json({ message: "Generation already in progress" });
  }

  isRunning = true;
  runGeneration(); // fire and forget — returns response immediately
  return NextResponse.json({ message: "Generation started" });
}
