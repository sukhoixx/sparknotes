import { NextRequest, NextResponse } from "next/server";
import { Converter } from "opencc-js";
import { prisma } from "@/lib/prisma";
import { fetchAllFeeds, filterRecentDuplicates, selectTopArticles } from "@/lib/rss";
import { summarizeArticle, translateToTraditionalChinese, detectHotEvent, CATEGORIES } from "@/lib/ai";

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
function stripHtml(s: string | null | undefined): string | null {
  return s ? decodeHtml(s.replace(/<[^>]*>/g, "")) : null;
}
function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;|&#0*39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function articleMatchesQuery(article: { title: string; content: string }, query: string): boolean {
  const text = `${article.title} ${article.content}`.toLowerCase();
  const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const matchCount = keywords.filter((kw) => text.includes(kw)).length;
  return matchCount >= Math.ceil(keywords.length * 0.5);
}

let isRunning = false;

async function runEventGenerate(eventSlug: string, eventLabel: string, query: string, maxPosts: number) {
  try {
    const existing = await prisma.post.findMany({ select: { sourceUrl: true, title: true } });
    const existingUrls = new Set(existing.map((p) => p.sourceUrl).filter(Boolean) as string[]);
    const existingTitles = new Set(existing.map((p) => p.title));

    const allArticles = await fetchAllFeeds(3);
    console.log(`[event-generate] ${allArticles.length} total articles from all feeds`);

    const matching = allArticles.filter(
      (a) => !existingUrls.has(a.link) && !existingTitles.has(a.title) && articleMatchesQuery(a, query)
    );
    console.log(`[event-generate] ${matching.length} articles match query "${query}"`);

    const recentTitles = existing.map((p) => p.title);
    const deduped = filterRecentDuplicates(matching, recentTitles);
    const top = selectTopArticles(deduped, maxPosts);
    console.log(`[event-generate] generating ${top.length} posts for event "${eventSlug}"`);

    const categoryCounts = await prisma.post.groupBy({ by: ["category"], _count: { _all: true } });
    const countMap = Object.fromEntries(categoryCounts.map((c) => [c.category, c._count._all]));
    const categoryFreqOrder = [...CATEGORIES].sort((a, b) => (countMap[a] ?? 0) - (countMap[b] ?? 0));

    let generated = 0;
    for (const article of top) {
      const post = await summarizeArticle(article, "news", categoryFreqOrder);
      if (!post) continue;
      const zh = await translateToTraditionalChinese(post);
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
          imageUrl: post.imageUrl ?? null,
          eventSlug,
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
      console.log(`[event-generate] +1 (${generated}/${top.length})`);
    }
    console.log(`[event-generate] done — ${generated} posts generated for "${eventSlug}"`);
  } catch (err) {
    console.error("[event-generate] error:", err);
  } finally {
    isRunning = false;
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { slug, label, description, query, score, maxPosts = 30 } = body;

  if (!slug || !label || !query) {
    return NextResponse.json({ error: "slug, label, and query are required" }, { status: 400 });
  }

  // Upsert the active event in DB
  await prisma.activeEvent.upsert({
    where: { id: 1 },
    create: { id: 1, slug, label, description: description ?? null, query, score: score ?? 10 },
    update: { slug, label, description: description ?? null, query, score: score ?? 10 },
  });

  if (isRunning) {
    return NextResponse.json({ message: "Generation already running, event saved" });
  }

  isRunning = true;
  runEventGenerate(slug, label, query, maxPosts);
  return NextResponse.json({ message: `Event "${slug}" saved and generation started` });
}

// Auto-detect hot event from all RSS headlines
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const articles = await fetchAllFeeds(1);
  const headlines = articles.map((a) => a.title).filter(Boolean);
  console.log(`[event-detect] checking ${headlines.length} headlines`);

  const event = await detectHotEvent(headlines);
  if (!event) {
    return NextResponse.json({ message: "No exceptional event detected", score: 0 });
  }

  // Upsert active event
  await prisma.activeEvent.upsert({
    where: { id: 1 },
    create: { id: 1, ...event },
    update: { ...event },
  });

  if (!isRunning) {
    isRunning = true;
    runEventGenerate(event.slug, event.label, event.query, 30);
  }

  return NextResponse.json({ message: `Hot event detected: "${event.label}"`, event });
}

// Clear the active event
export async function DELETE(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.activeEvent.deleteMany({ where: { id: 1 } });
  return NextResponse.json({ message: "Active event cleared" });
}
