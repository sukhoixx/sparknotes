import OpenAI from "openai";
import { jsonrepair } from "jsonrepair";
import type { RawArticle } from "./rss";

export const CATEGORIES = ["news", "us", "world", "politics", "military", "science", "technology", "finance", "entertainment", "celebrity", "sports", "business", "gaming", "travel", "animals", "inventions", "health", "beauty"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_META: Record<Category, { badge: string; authorEmoji: string; authorBg: string; emoji: string; gradient: string }> = {
  news:          { badge: "📰 News",          authorEmoji: "📰", authorBg: "linear-gradient(135deg,#1a1a2e,#16213e)",      emoji: "📰", gradient: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)" },
  us:            { badge: "🇺🇸 US",            authorEmoji: "🇺🇸", authorBg: "linear-gradient(135deg,#b22234,#3c3b6e)",      emoji: "🇺🇸", gradient: "linear-gradient(135deg,#b22234,#3c3b6e)" },
  politics:      { badge: "🏛️ Politics",      authorEmoji: "🏛️", authorBg: "linear-gradient(135deg,#2c3e50,#4ca1af)",      emoji: "🏛️", gradient: "linear-gradient(135deg,#2c3e50,#4ca1af)" },
  science:       { badge: "🔬 Science",       authorEmoji: "🧪", authorBg: "linear-gradient(135deg,#11998e,#38ef7d)",      emoji: "🔬", gradient: "linear-gradient(135deg,#11998e,#38ef7d)" },
  technology:    { badge: "💻 Technology",    authorEmoji: "🤖", authorBg: "linear-gradient(135deg,#6c47ff,#00b4d8)",      emoji: "💻", gradient: "linear-gradient(135deg,#6c47ff,#00b4d8)" },
  entertainment: { badge: "🎬 Entertainment", authorEmoji: "🎭", authorBg: "linear-gradient(135deg,#f953c6,#b91d73)",      emoji: "🎬", gradient: "linear-gradient(135deg,#f953c6,#b91d73)" },
  sports:        { badge: "🏅 Sports",        authorEmoji: "⚽", authorBg: "linear-gradient(135deg,#f7971e,#ffd200)",      emoji: "🏅", gradient: "linear-gradient(135deg,#f7971e,#ffd200)" },
  business:      { badge: "💼 Business",      authorEmoji: "📈", authorBg: "linear-gradient(135deg,#134e5e,#71b280)",      emoji: "💼", gradient: "linear-gradient(135deg,#134e5e,#71b280)" },
  gaming:        { badge: "🎮 Gaming",        authorEmoji: "🕹️", authorBg: "linear-gradient(135deg,#4b1248,#f10711)",      emoji: "🎮", gradient: "linear-gradient(135deg,#4b1248,#f10711)" },
  travel:        { badge: "✈️ Travel",        authorEmoji: "🗺️", authorBg: "linear-gradient(135deg,#f093fb,#f5576c)",      emoji: "✈️", gradient: "linear-gradient(135deg,#f093fb,#f5576c)" },
  animals:       { badge: "🐾 Animals",       authorEmoji: "🦁", authorBg: "linear-gradient(135deg,#78c850,#3c8a2e)",      emoji: "🐾", gradient: "linear-gradient(135deg,#78c850,#3c8a2e)" },
  inventions:    { badge: "💡 Inventions",    authorEmoji: "🔧", authorBg: "linear-gradient(135deg,#f6d365,#fda085)",      emoji: "💡", gradient: "linear-gradient(135deg,#f6d365,#fda085)" },
  world:         { badge: "🌍 World",         authorEmoji: "🌍", authorBg: "linear-gradient(135deg,#0f3460,#533483)",      emoji: "🌍", gradient: "linear-gradient(135deg,#0f3460,#533483)" },
  military:      { badge: "🪖 Military",      authorEmoji: "🪖", authorBg: "linear-gradient(135deg,#373b44,#4286f4)",      emoji: "🪖", gradient: "linear-gradient(135deg,#373b44,#4286f4)" },
  finance:       { badge: "💰 Finance",       authorEmoji: "💰", authorBg: "linear-gradient(135deg,#1a472a,#c9a84c)",      emoji: "💰", gradient: "linear-gradient(135deg,#1a472a,#c9a84c)" },
  health:        { badge: "💊 Health",        authorEmoji: "💊", authorBg: "linear-gradient(135deg,#56ab2f,#a8e063)",      emoji: "💊", gradient: "linear-gradient(135deg,#56ab2f,#a8e063)" },
  beauty:        { badge: "💄 Beauty",        authorEmoji: "💄", authorBg: "linear-gradient(135deg,#ee9ca7,#ffdde1)",      emoji: "💄", gradient: "linear-gradient(135deg,#ee9ca7,#ffdde1)" },
  celebrity:     { badge: "⭐ Celebrity",     authorEmoji: "⭐", authorBg: "linear-gradient(135deg,#c471ed,#f64f59)",      emoji: "⭐", gradient: "linear-gradient(135deg,#c471ed,#f64f59)" },
};

export interface GeneratedPost {
  title: string;
  snippet: string;
  body: string;
  funFact: string;
  tags: string[];
  category: Category;
  categories: string[];
  emoji: string;
  gradient: string;
  badge: string;
  authorEmoji: string;
  authorBg: string;
  sourceUrl: string;
  imageUrl?: string;
  zhTitle?: string;
  zhSnippet?: string;
  zhBody?: string;
  zhFunFact?: string;
}

export async function translateToTraditionalChinese(
  post: Pick<GeneratedPost, "title" | "snippet" | "body" | "funFact">
): Promise<{ zhTitle: string; zhSnippet: string; zhBody: string; zhFunFact: string } | null> {
  const client = getClient();
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const userPrompt = `Rewrite the following news article fields in Traditional Chinese (繁體中文) as a Chinese journalist would write them — natural, fluent prose, not a word-for-word translation. Use your judgement on names: keep well-known English acronyms (e.g. NATO, FBI, AI) in English; transliterate or translate proper nouns as a Taiwanese news outlet would. Preserve all HTML tags exactly as-is in body and funFact. Return ONLY valid JSON with no extra text or markdown.

Title: ${post.title}
Snippet: ${post.snippet}
Body (HTML): ${post.body}
FunFact (HTML): ${post.funFact}

Respond with this exact JSON schema:
{"zhTitle":"...","zhSnippet":"...","zhBody":"...","zhFunFact":"..."}`;

  try {
    const res = await client.chat.completions.create({
      model,
      max_tokens: 1500,
      temperature: 0.5,
      messages: [
        { role: "system", content: "你是台灣資深新聞記者，擅長將國際新聞以流暢自然的繁體中文重新撰寫。保留所有 HTML 標籤不變。只回傳 JSON 物件。" },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = res.choices[0]?.message?.content ?? "";
    const stripped = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) { console.error("[translate] no JSON in response:", raw); return null; }
    const parsed = JSON.parse(jsonrepair(jsonMatch[0]));
    if (!parsed.zhTitle || !parsed.zhBody) return null;
    return parsed as { zhTitle: string; zhSnippet: string; zhBody: string; zhFunFact: string };
  } catch (err) {
    console.error("[translate] error:", err);
    return null;
  }
}

export interface DetectedEvent {
  slug: string;
  label: string;
  description: string;
  query: string;
  score: number;
}

export async function detectHotEvent(headlines: string[]): Promise<DetectedEvent | null> {
  const client = getClient();
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const prompt = `You are a senior news editor with decades of experience. Given the following news headlines from today, determine if any single story qualifies as a truly exceptional, rare, must-cover event.

Criteria for a qualifying event (score 8-10):
- Extremely rare historically (e.g. terrorist attack on US soil, assassination of a world leader, major nuclear incident, catastrophic natural disaster with mass casualties)
- Geopolitically significant and rapidly developing
- Would make a reasonable person say "I can't believe this is happening"

Do NOT qualify routine events even if large (e.g. Japan earthquakes are common — only qualify if there are mass casualties or a nuclear facility is damaged, score would then be 8+). Political news, economic news, and celebrity news should rarely exceed score 6.

Headlines:
${headlines.slice(0, 100).join("\n")}

Return ONLY valid JSON. If no story qualifies (score < 8), return {"score":0}. Otherwise return:
{"slug":"kebab-case-event-id","label":"emoji + short display label","description":"one sentence explaining the event","query":"search keywords to find more articles about this event","score":8}`;

  try {
    const res = await client.chat.completions.create({
      model,
      max_tokens: 300,
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are a senior news editor. Return only valid JSON, no markdown." },
        { role: "user", content: prompt },
      ],
    });

    const raw = res.choices[0]?.message?.content ?? "";
    const stripped = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonrepair(jsonMatch[0]));
    if (!parsed.score || parsed.score < 8) return null;
    return parsed as DetectedEvent;
  } catch (err) {
    console.error("[detectHotEvent] error:", err);
    return null;
  }
}

export async function filterRelevantArticles(
  articles: { title: string }[],
  eventLabel: string,
): Promise<number[]> {
  if (articles.length === 0) return [];
  const client = getClient();
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
  const numbered = articles.map((a, i) => `${i}: ${a.title}`).join("\n");
  try {
    const res = await client.chat.completions.create({
      model,
      max_tokens: 300,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "You are a strict news editor. Given a breaking news event and a numbered list of article headlines, return a JSON array of the indices of articles whose headline is directly and primarily about that event. Exclude articles that only mention the topic in passing. Return ONLY a valid JSON array like [0,3,7] — no explanation, no markdown.",
        },
        {
          role: "user",
          content: `Event: ${eventLabel}\n\nHeadlines:\n${numbered}`,
        },
      ],
    });
    const raw = res.choices[0]?.message?.content?.trim() ?? "[]";
    const match = raw.match(/\[[\d,\s]*\]/);
    return match ? (JSON.parse(match[0]) as number[]).filter((i) => i >= 0 && i < articles.length) : [];
  } catch {
    return articles.map((_, i) => i);
  }
}

export async function translateLabel(label: string): Promise<string | null> {
  const client = getClient();
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
  try {
    const res = await client.chat.completions.create({
      model,
      max_tokens: 80,
      temperature: 0.3,
      messages: [
        { role: "system", content: "你是台灣資深新聞記者。將以下突發新聞事件標題翻譯成繁體中文，語氣自然流暢，符合台灣媒體用語習慣。專有名詞如 NATO、FBI、AI 等英文縮寫保留英文，人名地名依台灣慣例音譯或翻譯。只回傳翻譯後的文字，不加任何說明或標點以外的內容。" },
        { role: "user", content: label },
      ],
    });
    return res.choices[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

function getClient() {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1",
  });
}

function buildSystemPrompt(categoryFreqOrder?: string[]) {
  const catList = CATEGORIES.join(", ");
  const freqHint = categoryFreqOrder
    ? `\n- These categories are underrepresented — strongly prefer adding them as secondary categories when the article is even loosely relevant (listed least-to-most populated): ${categoryFreqOrder.join(", ")}\n- Avoid using news, us, world, politics as secondary categories unless the article is specifically and primarily about those topics`
    : "";
  return `You are a news editor who rewrites articles to be exciting, clear, and easy to understand.

Rules:
- Use plain language. If you must use a technical term or abbreviation, explain it immediately.
- Never use placeholder text like [date], [time], [location], [number] — use the actual value from the article or omit it entirely.
- If the article names specific people, companies, stocks, products, or numbers — include them. Never replace a concrete detail with a vague category (e.g. "a chip company" when the article says "Nvidia"). If the title promises a list or reveal, the body must deliver it.
- Be concise and direct. No fluff, no filler phrases, no hype. Get to the point.
- Write the body as HTML using only <p> and <strong> tags (3-5 paragraphs). Write as a journalist reporting the story directly — cover who, what, where, when, why, and what happens next. Never reference "the article", "the report", "the story", or use phrases like "the article highlights", "according to the article", "the piece notes", etc. Just state the facts as your own reporting. For news, us, world, and politics categories be especially thorough with details.
- The funFact should start with a relevant emoji and bold "Fun Fact:"
- Tags should be plain words without # prefix, relevant to the article (3-5 tags)
- Pick 1-3 most accurate categories for the article's actual content (most relevant first). Choose from: ${catList}${freqHint}

Respond ONLY with valid JSON matching this exact schema (no extra text, no markdown fences):
{
  "snippet": "One sentence summarizing the key point of the article (max 150 chars, no hype)",
  "body": "<p>HTML body...</p>",
  "funFact": "🔥 <strong>Fun Fact:</strong> ...",
  "tags": ["Tag1", "Tag2"],
  "categories": ["primary_category", "optional_second_category"]
}`;
}

export async function summarizeArticle(article: RawArticle, category: Category, categoryFreqOrder?: string[]): Promise<GeneratedPost | null> {
  const client = getClient();
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const userPrompt = `Category: ${category}
Source: ${article.source}
Published: ${article.pubDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
Title: ${article.title}
Content: ${article.content.slice(0, 1500)}
URL: ${article.link}`;

  try {
    const res = await client.chat.completions.create({
      model,
      max_tokens: 1200,
      temperature: 0.7,
      messages: [
        { role: "system", content: buildSystemPrompt(categoryFreqOrder) },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = res.choices[0]?.message?.content ?? "";
    const stripped = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) { console.error("[summarize] no JSON object in response:", raw); return null; }
    const parsed = JSON.parse(jsonrepair(jsonMatch[0])) as {
      snippet: string;
      body: string;
      funFact: string;
      tags: string[];
      categories?: string[];
    };

    const rawCats: string[] = Array.isArray(parsed.categories) ? parsed.categories : [category];
    const resolvedCategory: Category =
      rawCats.length > 0 && (CATEGORIES as readonly string[]).includes(rawCats[0])
        ? (rawCats[0] as Category)
        : category;
    const meta = CATEGORY_META[resolvedCategory] ?? CATEGORY_META["news"];

    return {
      title: article.title,
      snippet: parsed.snippet,
      body: parsed.body,
      funFact: parsed.funFact,
      tags: parsed.tags.map((t) => (t.startsWith("#") ? t : `#${t}`)),
      category: resolvedCategory,
      categories: rawCats,
      emoji: meta.emoji,
      gradient: meta.gradient,
      badge: meta.badge,
      authorEmoji: meta.authorEmoji,
      authorBg: meta.authorBg,
      sourceUrl: article.link,
      imageUrl: article.imageUrl,
    };
  } catch (err) {
    console.error("[summarize] error:", err);
    return null;
  }
}
