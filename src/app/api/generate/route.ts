import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchArticlesByCategory } from "@/lib/rss";
import { summarizeArticle, CATEGORIES } from "@/lib/ai";
import type { Category } from "@/lib/ai";

const NEW_PER_RUN = 5;

let isRunning = false;

async function runGeneration() {
  try {
    // Backfill categories for posts created before multi-category support
    await prisma.$executeRaw`
      UPDATE \`Post\` SET categories = JSON_ARRAY(category)
      WHERE JSON_LENGTH(categories) = 0
    `;

    // Get existing source URLs to avoid duplicates
    const existing = await prisma.post.findMany({ select: { sourceUrl: true } });
    const existingUrls = new Set(existing.map((p) => p.sourceUrl).filter(Boolean) as string[]);

    // Sort categories least-to-most populated so the AI prefers thin categories as secondary tags
    const categoryCounts = await prisma.post.groupBy({ by: ["category"], _count: { _all: true } });
    const countMap = Object.fromEntries(categoryCounts.map((c) => [c.category, c._count._all]));
    const categoryFreqOrder = [...CATEGORIES].sort((a, b) => (countMap[a] ?? 0) - (countMap[b] ?? 0));
    console.log(`[generate] category freq order: ${categoryFreqOrder.join(", ")}`);

    for (const category of CATEGORIES) {
      console.log(`[generate] ${category}: generating ${NEW_PER_RUN} new posts`);

      const articles = await fetchArticlesByCategory(category as Category, 14);
      const fresh = articles.filter((a) => !existingUrls.has(a.link));

      let generated = 0;
      for (const article of fresh) {
        if (generated >= NEW_PER_RUN) break;

        const post = await summarizeArticle(article, category as Category, categoryFreqOrder);
        if (!post) continue;

        await prisma.post.create({
          data: {
            title: post.title,
            snippet: post.snippet,
            body: post.body,
            funFact: post.funFact,
            tags: post.tags,
            category: post.category,
            categories: post.categories,
            emoji: post.emoji,
            gradient: post.gradient,
            badge: post.badge,
            authorEmoji: post.authorEmoji,
            authorBg: post.authorBg,
            sourceUrl: post.sourceUrl,
            imageUrl: post.imageUrl ?? null,
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
