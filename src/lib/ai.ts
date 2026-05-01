import OpenAI from "openai";
import type { RawArticle } from "./rss";

const CATEGORIES = ["science", "nature", "space", "sports", "tech", "world", "arts"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_META: Record<Category, { badge: string; authorEmoji: string; authorBg: string; emoji: string; gradient: string }> = {
  science: { badge: "🔬 Science", authorEmoji: "🧪", authorBg: "linear-gradient(135deg,#11998e,#38ef7d)", emoji: "🔬", gradient: "linear-gradient(135deg,#11998e,#38ef7d)" },
  nature:  { badge: "🌿 Nature",  authorEmoji: "🌿", authorBg: "linear-gradient(135deg,#134e5e,#71b280)", emoji: "🌿", gradient: "linear-gradient(135deg,#134e5e,#71b280)" },
  space:   { badge: "🚀 Space",   authorEmoji: "🔭", authorBg: "linear-gradient(135deg,#0f0c29,#302b63)", emoji: "🚀", gradient: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)" },
  sports:  { badge: "⚽ Sports",  authorEmoji: "🏆", authorBg: "linear-gradient(135deg,#43e97b,#38f9d7)", emoji: "⚽", gradient: "linear-gradient(135deg,#43e97b,#38f9d7)" },
  tech:    { badge: "🤖 Tech",    authorEmoji: "🤖", authorBg: "linear-gradient(135deg,#6c47ff,#00b4d8)", emoji: "🤖", gradient: "linear-gradient(135deg,#6c47ff,#00b4d8)" },
  world:   { badge: "🌍 World",   authorEmoji: "🌍", authorBg: "linear-gradient(135deg,#fc4a1a,#f7b733)", emoji: "🌍", gradient: "linear-gradient(135deg,#fc4a1a,#f7b733)" },
  arts:    { badge: "🎨 Arts",    authorEmoji: "🖌️", authorBg: "linear-gradient(135deg,#a18cd1,#fbc2eb)", emoji: "🎨", gradient: "linear-gradient(135deg,#a18cd1,#fbc2eb)" },
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

const SYSTEM_PROMPT = `You are a kids' news editor writing for middle schoolers (ages 11–14).
Your job is to take a raw news article and rewrite it so it's exciting, easy to understand, and educational.

Rules:
- Use simple words (no jargon). If you must use a technical term, explain it immediately.
- Keep sentences short. Write like you're telling a friend.
- Add excitement and wonder — make the reader feel "whoa, that's cool!"
- Classify into exactly one category: science, nature, space, sports, tech, world, arts
- Pick a single relevant emoji for the card image
- Write the body as HTML using only <p> and <strong> tags (2-4 paragraphs)
- The funFact should start with a relevant emoji and bold "Fun Fact:"
- Tags should start with # and be relevant (3-5 tags)

Respond ONLY with valid JSON matching this exact schema:
{
  "title": "Exciting kid-friendly headline (max 80 chars)",
  "snippet": "One-sentence hook that makes kids want to read more (max 150 chars)",
  "body": "<p>HTML body...</p>",
  "funFact": "🦋 <strong>Fun Fact:</strong> ...",
  "tags": ["#Tag1", "#Tag2"],
  "category": "science|nature|space|sports|tech|world|arts"
}`;

export async function summarizeArticle(article: RawArticle): Promise<GeneratedPost | null> {
  const client = getClient();
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const userPrompt = `Source: ${article.source}
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
      category: string;
    };

    const category = CATEGORIES.includes(parsed.category as Category)
      ? (parsed.category as Category)
      : "world";

    const meta = CATEGORY_META[category];

    return {
      title: parsed.title,
      snippet: parsed.snippet,
      body: parsed.body,
      funFact: parsed.funFact,
      tags: parsed.tags,
      category,
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
