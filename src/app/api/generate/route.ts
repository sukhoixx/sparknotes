import { NextRequest, NextResponse } from "next/server";
import { Converter } from "opencc-js";
import { prisma } from "@/lib/prisma";
import { fetchArticlesByCategory, filterRecentDuplicates, fetchOgImage } from "@/lib/rss";
import { summarizeArticle, translateToTraditionalChinese, selectArticlesForCategory, CATEGORIES } from "@/lib/ai";
import type { Category } from "@/lib/ai";

const _toSimplified = Converter({ from: "tw", to: "cn" });
function toSimplified(text: string): string {
  const result = _toSimplified(text);
  if (Array.from(result).length === Array.from(text).length) return result;
  return Array.from(text).map((ch) => {
    const c = _toSimplified(ch);
    return Array.from(c).length === 1 ? c : ch;
  }).join("");
}
function cnField(s: string | null | undefined): string | null {
  return s ? toSimplified(s) : null;
}
function decodeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#0*39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripHtml(s: string | null | undefined): string | null {
  return s ? decodeHtml(s.replace(/<[^>]*>/g, "")) : null;
}

const NEW_PER_RUN = 5;
const HIGH_VOLUME_CATEGORIES = new Set(["news", "world"]);
const HIGH_VOLUME_PER_RUN = 10;

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

    // Fetch titles of posts from the last 2 weeks for exact-title dedup
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentPosts = await prisma.post.findMany({
      where: { createdAt: { gte: twoWeeksAgo } },
      select: { title: true, createdAt: true },
    });
    const existingTitles = new Set(recentPosts.map((p) => p.title));
    // Subset of last 6 hours for Jaccard-based cross-source dedup
    const recentTitles = recentPosts
      .filter((p) => p.createdAt >= sixHoursAgo)
      .map((p) => p.title);

    // Sort categories least-to-most populated so the AI prefers thin categories as secondary tags
    const categoryCounts = await prisma.post.groupBy({ by: ["category"], _count: { _all: true } });
    const countMap = Object.fromEntries(categoryCounts.map((c) => [c.category, c._count._all]));
    const categoryFreqOrder = [...CATEGORIES].sort((a, b) => (countMap[a] ?? 0) - (countMap[b] ?? 0));
    console.log(`[generate] category freq order: ${categoryFreqOrder.join(", ")}`);

    for (const category of CATEGORIES) {
      const perRun = HIGH_VOLUME_CATEGORIES.has(category) ? HIGH_VOLUME_PER_RUN : NEW_PER_RUN;
      console.log(`[generate] ${category}: generating ${perRun} new posts`);

      const articles = await fetchArticlesByCategory(category as Category, 3);
      const fresh = articles.filter((a) => !existingUrls.has(a.link) && !existingTitles.has(a.title));
      const deduped = filterRecentDuplicates(fresh, recentTitles);
      const topArticles = await selectArticlesForCategory(deduped, category as Category, perRun);
      console.log(`[generate] ${category}: ${articles.length} total → ${fresh.length} fresh → ${deduped.length} after dedup → ${topArticles.length} AI-selected`);

      let generated = 0;
      for (const article of topArticles) {

        const post = await summarizeArticle(article, category as Category, categoryFreqOrder);
        if (!post) continue;

        let zh = await translateToTraditionalChinese(post);
        if (!zh) {
          console.log(`[generate] ${category}: translation failed, retrying...`);
          zh = await translateToTraditionalChinese(post);
        }

        await prisma.post.create({
          data: {
            title: stripHtml(post.title) ?? decodeHtml(post.title),
            snippet: stripHtml(post.snippet) ?? decodeHtml(post.snippet),
            body: post.body,
            funFact: decodeHtml(post.funFact),
            tags: post.tags,
            category: post.category,
            categories: post.categories,
            emoji: post.emoji,
            gradient: post.gradient,
            badge: post.badge,
            authorEmoji: post.authorEmoji,
            authorBg: post.authorBg,
            sourceUrl: post.sourceUrl,
            imageUrl: post.imageUrl ?? await fetchOgImage(article.link).catch(() => null) ?? null,
            zhTitle: stripHtml(zh?.zhTitle),
            zhSnippet: stripHtml(zh?.zhSnippet),
            zhBody: zh?.zhBody ?? null,
            zhFunFact: zh?.zhFunFact ? decodeHtml(zh.zhFunFact) : null,
            zhTitleCn: cnField(stripHtml(zh?.zhTitle) ?? zh?.zhTitle),
            zhSnippetCn: cnField(stripHtml(zh?.zhSnippet) ?? zh?.zhSnippet),
            zhBodyCn: cnField(zh?.zhBody),
            zhFunFactCn: zh?.zhFunFact ? cnField(decodeHtml(zh.zhFunFact)) : null,
          },
        });

        existingUrls.add(article.link);
        existingTitles.add(article.title);
        generated++;
        console.log(`[generate] ${category}: +1 (${generated}/${perRun})`);
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
