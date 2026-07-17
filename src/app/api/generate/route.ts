import { NextRequest, NextResponse } from "next/server";
import { Converter } from "opencc-js";
import { prisma } from "@/lib/prisma";
import { fetchArticlesByCategory, filterRecentDuplicates, selectTopArticles, fetchOgImage, fetchFullArticle, filterSimilarTitles } from "@/lib/rss";
import { summarizeArticle, translateToTraditionalChinese, selectArticlesForCategory, pickMostNewsworthyPost, CATEGORIES } from "@/lib/ai";
import type { Category } from "@/lib/ai";
import { sendBreakingNewsPush } from "@/lib/push";

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
const HIGH_VOLUME_CATEGORIES = new Set(["news", "us", "world", "technology", "asia"]);
const HIGH_VOLUME_PER_RUN = 8;
const LOW_VOLUME_CATEGORIES = new Set(["entertainment", "beauty", "animals", "travel", "gaming", "celebrity"]);
const LOW_VOLUME_PER_RUN = 3;

const WORLD_CUP_END = new Date("2026-07-18T23:59:59Z");
const WORLD_CUP_PATTERN = /world cup|fifa|worldcup/i;
const WORLD_CUP_MIN = 2;

let isRunning = false;

async function runGeneration() {
  const generatedPostIds: number[] = [];
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
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentPosts = await prisma.post.findMany({
      where: { createdAt: { gte: twoDaysAgo } },
      select: { title: true, createdAt: true },
    });
    const existingTitles = new Set(recentPosts.map((p) => p.title));
    // Subset of last 6 hours for Jaccard-based cross-source dedup
    const recentTitles = recentPosts
      .filter((p) => p.createdAt >= sixHoursAgo)
      .map((p) => p.title);


    for (const category of CATEGORIES) {
      const perRun = HIGH_VOLUME_CATEGORIES.has(category) ? HIGH_VOLUME_PER_RUN : LOW_VOLUME_CATEGORIES.has(category) ? LOW_VOLUME_PER_RUN : NEW_PER_RUN;
      console.log(`[generate] ${category}: generating ${perRun} new posts`);

      const articles = await fetchArticlesByCategory(category as Category, 2);
      const fresh = articles.filter((a) => !existingUrls.has(a.link) && !existingTitles.has(a.title));
      const deduped = filterRecentDuplicates(fresh, recentTitles);
      const clustered = selectTopArticles(deduped, perRun * 3);
      let topArticles = await selectArticlesForCategory(clustered, category as Category, perRun);
      console.log(`[generate] ${category}: ${articles.length} total → ${fresh.length} fresh → ${deduped.length} after dedup → ${clustered.length} clustered → ${topArticles.length} AI-selected`);

      // Guarantee at least WORLD_CUP_MIN World Cup articles in sports during the tournament
      if (category === "sports" && new Date() <= WORLD_CUP_END) {
        const wcSelected = topArticles.filter((a) => WORLD_CUP_PATTERN.test(a.title));
        if (wcSelected.length < WORLD_CUP_MIN) {
          const wcPool = deduped.filter((a) =>
            WORLD_CUP_PATTERN.test(a.title) &&
            !topArticles.some((s) => s.link === a.link)
          );
          const needed = WORLD_CUP_MIN - wcSelected.length;
          const toAdd = wcPool.slice(0, needed);
          if (toAdd.length > 0) {
            topArticles = [...toAdd, ...topArticles];
            console.log(`[generate] sports: topped up ${toAdd.length} World Cup article(s) to meet minimum`);
          }
        }
      }

      let generated = 0;
      for (const article of topArticles) {
        // Sports must always use full article — RSS snippets cause the model to hallucinate scores/scorers.
        // Other categories fetch full article only when RSS didn't provide content:encoded.
        const needsFullFetch = category === "sports" || !article.fullContent;
        if (needsFullFetch) {
          const fullText = await fetchFullArticle(article.link);
          if (fullText) {
            article.content = fullText;
            article.fullContent = true;
            console.log(`[generate] ${category}: fetched full article via Jina (${fullText.length} chars) for "${article.title.slice(0, 60)}"`);
          } else {
            console.log(`[generate] ${category}: Jina fetch failed, using RSS snippet for "${article.title.slice(0, 60)}"`);
          }
        }

        const post = await summarizeArticle(article, category as Category);
        if (!post) continue;

        let zh = await translateToTraditionalChinese(post);
        if (!zh) {
          console.log(`[generate] ${category}: translation failed, retrying...`);
          zh = await translateToTraditionalChinese(post);
        }

        const created = await prisma.post.create({
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
        generatedPostIds.push(created.id);

        existingUrls.add(article.link);
        existingTitles.add(article.title);
        generated++;
        console.log(`[generate] ${category}: +1 (${generated}/${perRun})`);
      }

      console.log(`[generate] ${category}: done (${generated} generated)`);
    }

    // Let AI pick the most newsworthy article from this run, avoiding topics pushed today
    if (generatedPostIds.length > 0) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [candidates, recentPushes] = await Promise.all([
        prisma.post.findMany({
          where: { id: { in: generatedPostIds } },
          select: { id: true, title: true, snippet: true, category: true },
        }),
        prisma.pushLog.findMany({
          where: { sentAt: { gte: oneDayAgo } },
          select: { title: true },
          orderBy: { sentAt: "desc" },
        }),
      ]);
      const EXCLUDED_PUSH_CATEGORIES = new Set(["animals", "entertainment", "gaming", "beauty", "travel", "politics"]);
      const recentTitles = recentPushes.map((p) => p.title);
      const eligibleTitles = filterSimilarTitles(candidates.filter((p) => !EXCLUDED_PUSH_CATEGORIES.has(p.category)).map((p) => p.title), recentTitles);
      const eligibleCandidates = candidates.filter((p) => eligibleTitles.includes(p.title));
      console.log(`[push] ${candidates.length} candidates → ${eligibleCandidates.length} after topic dedup (${candidates.length - eligibleCandidates.length} filtered)`);
      const topPostId = await pickMostNewsworthyPost(eligibleCandidates, recentTitles);
      const topPost = candidates.find((p) => p.id === topPostId);
      if (topPost) {
        console.log(`[push] sending push for post ${topPost.id}: "${topPost.title}"`);
        await prisma.pushLog.create({ data: { postId: topPost.id, title: topPost.title } });
        await sendBreakingNewsPush(topPost.id, topPost.title, topPost.snippet);
      }
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
