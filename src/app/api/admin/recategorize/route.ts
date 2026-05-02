import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, CATEGORY_META } from "@/lib/ai";
import type { Category } from "@/lib/ai";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are a news categorizer. Given a news article title and summary, pick the single best category from this list:
news, science, technology, entertainment, sports, business, gaming, travel, animals, inventions

Respond ONLY with a JSON object like: {"category": "technology"}
No explanation, no markdown, just the JSON.`;

async function classifyPost(title: string, snippet: string): Promise<Category | null> {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1",
  });
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  try {
    const res = await client.chat.completions.create({
      model,
      max_tokens: 50,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Title: ${title}\nSummary: ${snippet}` },
      ],
    });

    const raw = res.choices[0]?.message?.content ?? "";
    const stripped = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(stripped) as { category?: string };
    const cat = parsed.category;
    if (cat && (CATEGORIES as readonly string[]).includes(cat)) return cat as Category;
    return null;
  } catch {
    return null;
  }
}

let isRunning = false;

async function runRecategorize() {
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, snippet: true, category: true },
    orderBy: { id: "asc" },
  });

  console.log(`[recategorize] ${posts.length} posts to check`);

  let changed = 0;
  let failed = 0;

  for (const post of posts) {
    const newCat = await classifyPost(post.title, post.snippet);

    if (!newCat) {
      failed++;
      console.log(`[recategorize] #${post.id} classify failed, skipping`);
      continue;
    }

    if (newCat === post.category) continue;

    const meta = CATEGORY_META[newCat];
    await prisma.post.update({
      where: { id: post.id },
      data: {
        category: newCat,
        badge: meta.badge,
        emoji: meta.emoji,
        gradient: meta.gradient,
        authorEmoji: meta.authorEmoji,
        authorBg: meta.authorBg,
      },
    });

    console.log(`[recategorize] #${post.id}: ${post.category} → ${newCat} | ${post.title}`);
    changed++;
  }

  console.log(`[recategorize] done — ${changed} changed, ${failed} failed, ${posts.length - changed - failed} unchanged`);
  isRunning = false;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-generate-secret");
  if (secret !== process.env.GENERATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRunning) {
    return NextResponse.json({ message: "Recategorization already in progress" });
  }

  const postCount = await prisma.post.count();
  isRunning = true;
  runRecategorize();
  return NextResponse.json({ message: `Recategorization started for ${postCount} posts` });
}
