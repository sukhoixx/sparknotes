import OpenAI from "openai";
import type { RawArticle } from "./rss";

export const CATEGORIES = ["news", "science", "technology", "entertainment", "sports", "business", "gaming", "travel", "animals", "inventions"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_META: Record<Category, { badge: string; authorEmoji: string; authorBg: string; emoji: string; gradient: string }> = {
  news:          { badge: "📰 News",          authorEmoji: "📰", authorBg: "linear-gradient(135deg,#1a1a2e,#16213e)",      emoji: "📰", gradient: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)" },
  science:       { badge: "🔬 Science",       authorEmoji: "🧪", authorBg: "linear-gradient(135deg,#11998e,#38ef7d)",      emoji: "🔬", gradient: "linear-gradient(135deg,#11998e,#38ef7d)" },
  technology:    { badge: "💻 Technology",    authorEmoji: "🤖", authorBg: "linear-gradient(135deg,#6c47ff,#00b4d8)",      emoji: "💻", gradient: "linear-gradient(135deg,#6c47ff,#00b4d8)" },
  entertainment: { badge: "🎬 Entertainment", authorEmoji: "🎭", authorBg: "linear-gradient(135deg,#f953c6,#b91d73)",      emoji: "🎬", gradient: "linear-gradient(135deg,#f953c6,#b91d73)" },
  sports:        { badge: "🏅 Sports",        authorEmoji: "⚽", authorBg: "linear-gradient(135deg,#f7971e,#ffd200)",      emoji: "🏅", gradient: "linear-gradient(135deg,#f7971e,#ffd200)" },
  business:      { badge: "💼 Business",      authorEmoji: "📈", authorBg: "linear-gradient(135deg,#134e5e,#71b280)",      emoji: "💼", gradient: "linear-gradient(135deg,#134e5e,#71b280)" },
  gaming:        { badge: "🎮 Gaming",        authorEmoji: "🕹️", authorBg: "linear-gradient(135deg,#4b1248,#f10711)",      emoji: "🎮", gradient: "linear-gradient(135deg,#4b1248,#f10711)" },
  travel:        { badge: "✈️ Travel",        authorEmoji: "🗺️", authorBg: "linear-gradient(135deg,#f093fb,#f5576c)",      emoji: "✈️", gradient: "linear-gradient(135deg,#f093fb,#f5576c)" },
  animals:       { badge: "🐾 Animals",       authorEmoji: "🦁", authorBg: "linear-gradient(135deg,#78c850,#3c8a2e)",      emoji: "🐾", gradient: "linear-gradient(135deg,#78c850,#3c8a2e)" },
  inventions:    { badge: "💡 Inventions",    authorEmoji: "🔧", authorBg: "linear-gradient(135deg,#f6d365,#fda085)",      emoji: "💡", gradient: "linear-gradient(135deg,#f6d365,#fda085)" },
};

export interface GeneratedPost {
  title: string;
  snippet: string;
  body: string;
  funFact: string;
  tags: string[];
  category: Category;
  emoji: string;
  gradient: string;
  badge: string;
  authorEmoji: string;
  authorBg: string;
  sourceUrl: string;
}

function getClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1",
  });
}

const SYSTEM_PROMPT = `You are a news editor who rewrites articles to be exciting, clear, and easy to understand.

Rules:
- Use plain language. If you must use a technical term or abbreviation, explain it immediately.
- Keep sentences short to moderate. Write like you're telling a friend.
- Add excitement and wonder — make the reader feel "whoa, that's cool!"
- Write the body as HTML using only <p> and <strong> tags (2-4 paragraphs)
- The funFact should start with a relevant emoji and bold "Fun Fact:"
- Tags should start with # and be relevant (3-5 tags)
- Pick the most accurate category for the article's actual content, regardless of the source feed it came from. Choose from: news, science, technology, entertainment, sports, business, gaming, travel, animals, inventions

Respond ONLY with valid JSON matching this exact schema (no extra text, no markdown fences):
{
  "title": "Exciting headline (max 80 chars)",
  "snippet": "One-sentence hook that makes the reader want more (max 150 chars)",
  "body": "<p>HTML body...</p>",
  "funFact": "🔥 <strong>Fun Fact:</strong> ...",
  "tags": ["#Tag1", "#Tag2"],
  "category": "one of: news, science, technology, entertainment, sports, business, gaming, travel, animals, inventions"
}`;

export async function summarizeArticle(article: RawArticle, category: Category): Promise<GeneratedPost | null> {
  const client = getClient();
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const userPrompt = `Category: ${category}
Source: ${article.source}
Title: ${article.title}
Content: ${article.content.slice(0, 1500)}
URL: ${article.link}`;

  try {
    const res = await client.chat.completions.create({
      model,
      max_tokens: 1200,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = res.choices[0]?.message?.content ?? "";
    const stripped = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(stripped) as {
      title: string;
      snippet: string;
      body: string;
      funFact: string;
      tags: string[];
      category?: string;
    };

    const resolvedCategory: Category =
      parsed.category && (CATEGORIES as readonly string[]).includes(parsed.category)
        ? (parsed.category as Category)
        : category;
    const meta = CATEGORY_META[resolvedCategory];

    return {
      title: parsed.title,
      snippet: parsed.snippet,
      body: parsed.body,
      funFact: parsed.funFact,
      tags: parsed.tags,
      category: resolvedCategory,
      emoji: meta.emoji,
      gradient: meta.gradient,
      badge: meta.badge,
      authorEmoji: meta.authorEmoji,
      authorBg: meta.authorBg,
      sourceUrl: article.link,
    };
  } catch {
    return null;
  }
}
