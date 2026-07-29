import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchArticlesByCategory, filterRecentDuplicates, selectTopArticles, fetchOgImage, fetchFullArticle, filterSimilarTitles } from "@/lib/rss";
import { summarizeArticle, translateToTraditionalChinese, selectArticlesForCategory, isSensitiveContent, CATEGORIES } from "@/lib/ai";
import type { Category } from "@/lib/ai";
import { Converter } from "opencc-js";

export const dynamic = "force-dynamic";

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

const HIGH_VOLUME_CATEGORIES = new Set(["news", "us", "world", "technology", "asia"]);
const LOW_VOLUME_CATEGORIES = new Set(["entertainment", "beauty", "animals", "travel", "gaming", "celebrity"]);
const NEW_PER_RUN = 5;
const HIGH_VOLUME_PER_RUN = 8;
const LOW_VOLUME_PER_RUN = 3;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-generate-secret");
  if (secret !== process.env.GENERATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const category = body.category as string;

  if (!category || !CATEGORIES.includes(category as Category)) {
    return NextResponse.json({ error: `Invalid category. Valid values: ${CATEGORIES.join(", ")}` }, { status: 400 });
  }

  const perRun = HIGH_VOLUME_CATEGORIES.has(category) ? HIGH_VOLUME_PER_RUN : LOW_VOLUME_CATEGORIES.has(category) ? LOW_VOLUME_PER_RUN : NEW_PER_RUN;

  const existing = await prisma.post.findMany({ select: { sourceUrl: true } });
  const existingUrls = new Set(existing.map((p) => p.sourceUrl).filter(Boolean) as string[]);
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const recentPosts = await prisma.post.findMany({
    where: { createdAt: { gte: twoDaysAgo } },
    select: { title: true, createdAt: true },
  });
  const existingTitles = new Set(recentPosts.map((p) => p.title));
  const recentTitles = recentPosts.filter((p) => p.createdAt >= sixHoursAgo).map((p) => p.title);

  const articles = await fetchArticlesByCategory(category as Category, 2);
  const fresh = articles.filter((a) => !existingUrls.has(a.link) && !existingTitles.has(a.title) && !isSensitiveContent(a.title));
  const deduped = filterRecentDuplicates(fresh, recentTitles);
  const clustered = selectTopArticles(deduped, perRun * 3);
  const topArticles = await selectArticlesForCategory(clustered, category as Category, perRun);

  console.log(`[generate/category] ${category}: ${articles.length} total → ${fresh.length} fresh → ${clustered.length} clustered → ${topArticles.length} AI-selected`);
  console.log(`[generate/category] ${category} clustered:\n${clustered.map((a, i) => `  [${i + 1}] [${a.source}] ${a.title}`).join("\n")}`);
  console.log(`[generate/category] ${category} selected:\n${topArticles.length === 0 ? "  (none)" : topArticles.map((a) => `  • ${a.title}`).join("\n")}`);

  const generated: string[] = [];

  for (const article of topArticles) {
    const needsFullFetch = category === "sports" || !article.fullContent;
    if (needsFullFetch) {
      const result = await fetchFullArticle(article.link);
      if (result) {
        article.content = result.text;
        article.fullContent = true;
      }
    }

    const post = await summarizeArticle(article, category as Category);
    if (!post) continue;

    const zh = await translateToTraditionalChinese(post);

    const imageUrl = post.imageUrl ?? (await fetchOgImage(article.link).catch(() => null)) ?? undefined;

    const created = await prisma.post.create({
      data: {
        title: post.title,
        snippet: post.snippet,
        body: post.body,
        funFact: post.funFact,
        tags: post.tags,
        category: post.category,
        categories: [post.category],
        emoji: post.emoji,
        gradient: post.gradient,
        badge: post.badge,
        authorEmoji: post.authorEmoji,
        authorBg: post.authorBg,
        sourceUrl: post.sourceUrl,
        imageUrl: imageUrl ?? null,
        zhTitle: zh?.zhTitle ?? null,
        zhSnippet: zh?.zhSnippet ?? null,
        zhBody: zh?.zhBody ?? null,
        zhFunFact: zh?.zhFunFact ?? null,
        zhTitleCn: zh ? cnField(zh.zhTitle) : null,
        zhSnippetCn: zh ? cnField(zh.zhSnippet) : null,
        zhBodyCn: zh ? cnField(zh.zhBody) : null,
        zhFunFactCn: zh ? cnField(zh.zhFunFact) : null,
      },
    });

    generated.push(created.title);
    console.log(`[generate/category] ${category}: created "${created.title}"`);
  }

  return NextResponse.json({ category, generated: generated.length, titles: generated });
}
