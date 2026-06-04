import OpenAI from "openai";
import { jsonrepair } from "jsonrepair";
import type { RawArticle } from "./rss";

export const CATEGORIES = ["news", "us", "world", "politics", "military", "science", "technology", "finance", "entertainment", "celebrity", "sports", "business", "gaming", "travel", "animals", "inventions", "health", "beauty", "asia"] as const;
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
  asia:          { badge: "🌏 Asia",          authorEmoji: "🌏", authorBg: "linear-gradient(135deg,#c0392b,#e67e22)",      emoji: "🌏", gradient: "linear-gradient(135deg,#c0392b,#e67e22)" },
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
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

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
        { role: "system", content: "你是台灣資深新聞記者，擅長將國際新聞以流暢自然的繁體中文重新撰寫。讀者來自台灣、中國大陸、香港及海外華人社區，請使用台灣慣用繁體中文，同時避免過於本土化的用語，確保大多數華語讀者都能理解。保留所有 HTML 標籤不變。只回傳 JSON 物件。" },
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
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

  const prompt = `You are the chief editor of a major international news agency. Your job is to decide whether any story breaking right now is exceptional enough to warrant a dedicated "Breaking" tab that interrupts the normal news feed.

A story qualifies (score 8-10) if it meets ALL of the following:
1. It will dominate front pages of major global media (NYT, BBC, Reuters, etc.) for several days — not just today
2. Ordinary people who don't follow politics closely will still hear about it and care
3. It falls into one of these categories:
   - A historic diplomatic moment: a head of state visiting a longtime adversary, a surprise peace deal, a sudden alliance shift, or a major summit between rivals — especially involving major powers (US, China, Russia, EU, Taiwan, North Korea, Middle East powers, etc.)
   - A catastrophic or violent event: assassination or attempted assassination of a world leader, major terrorist attack, nuclear incident, large-scale military strike, or natural disaster with mass casualties — anywhere in the world
   - A geopolitical rupture: a country leaving a major alliance, a declaration of war or ceasefire, a coup in a strategically significant nation, a landmark election result that shocks the world

Do NOT qualify (score ≤ 6):
- Routine political news, legislation, executive orders, or policy disputes
- Economic data, market moves, trade negotiations (unless a treaty is signed)
- Celebrity, sports, or entertainment news
- Common natural disasters in disaster-prone regions without extraordinary casualties
- Ongoing conflicts with no major new development

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
        { role: "system", content: "You are the chief editor of a major international news agency. Return only valid JSON, no markdown." },
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
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";
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
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";
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

const AUDIENCE = "Your readers are primarily from the US, Taiwan, China, and Europe — prioritize stories that resonate across these regions, not just one country.";

const CATEGORY_SELECTION_PROMPTS: Record<Category, string> = {
  news: `You are the senior editor for breaking news at a major international outlet. ${AUDIENCE} Select articles that have significant, wide-ranging impact on people's lives at national or global scale; are covered by or would be covered by AP, Reuters, BBC, NYT, or CNN; and represent genuinely new developments, not rehashed analysis or opinion. Reject articles that are purely local stories with limited reach; opinion, listicle, or sponsored content; have vague titles with no real substance (e.g. "Things to know today"); cover sports, entertainment, or celebrity; or are betting tips or stock picks. Return ONLY a JSON array of selected indices (1-based), e.g. [1, 4, 7]. No explanation.`,

  us: `You are the senior editor for US domestic coverage at an international outlet. ${AUDIENCE} Select articles covering significant US policy, law, economy, or social issues that affect large numbers of Americans — national rather than local/regional in scope. International readers should find these stories meaningful for understanding America. Reject local news, sports, entertainment, celebrity, and promotional content. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  world: `You are the senior editor for international affairs at a major outlet. ${AUDIENCE} Select articles covering major geopolitical events, active conflicts, diplomatic developments, elections or political transitions, and economic or humanitarian crises affecting large populations. Stories must matter beyond a single country's borders. Reject local news, sports, and entertainment. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  politics: `You are the senior editor for political coverage at a major outlet. ${AUDIENCE} Select articles covering: major legislative moves, executive actions, or court rulings; significant shifts in political power or policy; electoral news with national or international significance; political accountability stories with real documented impact. Reject opinion or punditry without a hard news hook, polling stories with no new development, and local politics. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  military: `You are the senior editor for defense and national security at a major outlet. ${AUDIENCE} Select articles covering: active conflicts or major battlefield developments; significant weapons programs or defense technology; major military exercises or alliance shifts; security threats with broad strategic implications. Reject routine military movements with no significance, recycled old reporting, and opinion pieces. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  science: `You are the senior editor for science coverage at a major outlet. ${AUDIENCE} Select articles covering: peer-reviewed discoveries with real-world implications; space exploration milestones; climate or environmental findings affecting large populations; medical or biological breakthroughs; physics, chemistry, or earth science findings that push the frontier. Reject pre-publication speculation, pseudoscience, "scientists say" clickbait with no substance, and incremental non-news. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  technology: `You are the senior editor for technology at a major outlet. ${AUDIENCE} Select articles covering: major product launches or platform updates from significant companies; AI breakthroughs or notable model releases; cybersecurity incidents affecting many users; big tech regulatory or antitrust actions; significant acquisitions or funding rounds that reshape the industry. Reject minor app updates, gadget reviews, gaming reviews or updates, sponsored content, and incremental product refreshes. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  finance: `You are the senior editor for financial news at a major outlet. ${AUDIENCE} Select articles covering: significant market moves with clear causes; central bank decisions and their economic implications; major earnings from market-moving companies; key economic data (jobs, inflation, GDP) with meaningful impact; corporate crises, bankruptcies, or fraud of broad significance. Reject generic investment advice, "top stocks to buy" listicles, promotional content, and minor company news. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  entertainment: `You are the senior editor for entertainment at a major outlet. ${AUDIENCE} Select articles covering: major film, TV, or music releases and announcements; box office results for significant releases; streaming platform news (new shows, cancellations, major deals); award nominations and wins; major tours or album drops. Reject minor celebrity drama, unverified rumors, and articles with no real news hook. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  celebrity: `You are the senior editor for celebrity coverage at a major outlet. ${AUDIENCE} Select articles covering: major life events (engagements, divorces, births, deaths) of widely recognized public figures; significant public controversies with broad interest; major interviews or revelations from A-list celebrities; viral moments dominating public conversation. Reject minor gossip, unverified rumors, D-list celebrities most readers won't recognize, and purely speculative stories. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  sports: `You are the senior editor for sports coverage at a major international outlet. ${AUDIENCE} Select articles covering: major game results from high-profile leagues and tournaments (NBA, NFL, Premier League, Champions League, Olympics, Grand Slam tennis, Formula 1, etc.); significant player transfers, star player injuries, or major contract news; championship and playoff storylines; record-breaking performances; major controversies or off-field stories with broad interest. Reject betting tips and odds previews, local team coverage with narrow appeal, fantasy sports advice, and minor game previews. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  business: `You are the senior editor for business coverage at a major outlet. ${AUDIENCE} Select articles covering: major corporate mergers, acquisitions, or breakups; significant layoffs or hiring surges at large companies; corporate strategy shifts that affect consumers or markets broadly; prominent business leaders making significant moves; regulatory actions against major companies. Reject small business profiles, promotional puff pieces, and minor earnings that don't move markets. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  gaming: `You are the senior editor for gaming coverage at a major outlet. ${AUDIENCE} Select articles covering: major game launches or reveal announcements from significant studios; console or platform hardware news; high-viewership esports events; significant gaming industry business moves (acquisitions, studio closures, publisher shifts); notable controversies or cultural moments in gaming. Reject minor patch notes, mobile game promotions, niche esports with narrow audiences, and opinion pieces. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  travel: `You are the senior editor for travel coverage at a major outlet. ${AUDIENCE} Select articles covering: major airline or cruise industry news affecting travelers broadly; significant destination openings, closures, or policy changes; travel disruptions (strikes, disasters, visa policy shifts) affecting many travelers; emerging travel trends with wide appeal across the US, Asia, and Europe. Reject sponsored destination guides, generic "best places" listicles, and hotel press releases. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  animals: `You are the senior editor for wildlife and animal coverage at a major outlet. ${AUDIENCE} Select articles covering: significant wildlife conservation news or discoveries; endangered species updates with meaningful new developments; animal research with scientific significance; environmental threats to ecosystems; heartwarming or extraordinary animal stories with broad human appeal. Reject minor zoo press releases, repetitive cute-animal filler, and stories with no new development. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  inventions: `You are the senior editor for innovation and inventions at a major outlet. ${AUDIENCE} Select articles covering: genuinely novel inventions or prototypes with clear real-world application potential; significant engineering achievements; new materials, processes, or technologies that could transform industries; patents or research signaling meaningful near-future shifts. Reject incremental product improvements, marketing-driven "innovation" announcements, and vaporware with no working prototype or credible backing. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  health: `You are the senior editor for health and medicine at a major outlet. ${AUDIENCE} Select articles covering: clinical trial results or FDA approvals/rejections with broad patient impact; disease outbreak or public health emergency updates; major medical research findings affecting treatment or prevention; health policy changes affecting large populations; significant mental health research findings. Reject generic wellness tips, supplement or diet promotion, minor studies with no clinical significance, and health scare clickbait. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  beauty: `You are the senior editor for beauty and fashion at a major outlet. ${AUDIENCE} Select articles covering: major fashion week moments or significant designer announcements; notable beauty product launches from major brands; beauty or fashion trends gaining mainstream traction; industry business news (major acquisitions, brand launches by prominent figures); cultural or social movements intersecting meaningfully with beauty and fashion. Reject minor product reviews, sponsored content, and niche trends with very limited appeal. Return ONLY a JSON array of selected indices (1-based). No explanation.`,

  asia: `You are the senior editor for Asia-Pacific coverage at a major international outlet. ${AUDIENCE} Select articles covering: major political or diplomatic developments across East Asia, Southeast Asia, or South Asia; economic policy decisions by China, Japan, South Korea, or ASEAN nations with regional or global impact; Taiwan Strait tensions, cross-strait relations, or Taiwan domestic politics; military or security developments in the Indo-Pacific; significant elections or leadership changes across Asia. Slightly prefer stories directly about China, Taiwan, or Hong Kong when choosing between similarly newsworthy articles. Reject purely local human-interest stories with no regional significance, generic travel or culture pieces, and entertainment news. Return ONLY a JSON array of selected indices (1-based). No explanation.`,
};

export async function selectArticlesForCategory(articles: RawArticle[], category: Category, n: number): Promise<RawArticle[]> {
  if (articles.length === 0) return [];
  if (articles.length <= n) return articles;

  const client = getClient();
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

  const articleList = articles
    .map((a, i) => `[${i + 1}] Source: ${a.source}\nTitle: ${a.title}\nSnippet: ${a.content.slice(0, 200)}`)
    .join("\n\n");

  const userPrompt = `Here are ${articles.length} articles published in the last 3 hours. Select the indices of the best ${n} to summarize and publish.\n\n${articleList}`;

  try {
    const res = await client.chat.completions.create({
      model,
      max_tokens: 100,
      temperature: 0.2,
      messages: [
        { role: "system", content: CATEGORY_SELECTION_PROMPTS[category] },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = res.choices[0]?.message?.content ?? "";
    const match = raw.match(/\[[\d,\s]+\]/);
    if (!match) {
      console.error("[select] could not parse indices from response:", raw);
      return articles.slice(0, n);
    }

    const indices: number[] = JSON.parse(match[0]);
    const selected = indices
      .filter((i) => i >= 1 && i <= articles.length)
      .map((i) => articles[i - 1]);

    return selected.slice(0, n);
  } catch (err) {
    console.error("[select] error:", err);
    return articles.slice(0, n);
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
    ? `\n- These categories are underrepresented — consider adding them as secondary categories when the article is relevant (listed least-to-most populated): ${categoryFreqOrder.join(", ")}\n- Avoid using news, us, world, politics as secondary categories unless the article is specifically and primarily about those topics`
    : "";
  return `You are a journalist who cares deeply about fact-checking, producing clear and easy-to-read articles, and using humor where the subject genuinely calls for it. Your readers span the US, Taiwan, China, Asia, and Europe — write for a global audience.

Rules:
- Write in plain, direct language. Explain any technical term or abbreviation on first use.
- Never use placeholder text like [date], [time], [location], [number] — use the actual value from the article or omit it entirely.
- Include specific names — people, companies, countries, stocks, products, numbers. Never replace a concrete detail with a vague stand-in (e.g. never write "a tech company" when the article says "Apple").
- If the title promises a list or specific reveal (e.g. "Top 5 stocks to watch", "3 reasons why"), deliver each item explicitly in the body. Readers must not have to hunt for what the headline promised.
- Use <strong> tags for important names, places, dates, organizations, and key terms on their first meaningful mention. Bold with purpose — only what a skimming reader needs to catch.
- Write the body as HTML using only <p> and <strong> tags (3-4 paragraphs). Report directly: cover who, what, where, when, why, and what happens next. Never say "the article says", "according to the report", or "the piece notes" — state facts as your own reporting.
- The funFact must start with a relevant emoji and <strong>Fun Fact:</strong> — make it genuinely interesting, not filler.
- Tags: 3-5 plain words without # prefix, relevant to the article.
- Pick 1-2 most accurate categories for the article's actual content (most relevant first). Choose from: ${catList}${freqHint}
- Only assign "asia" if the article is directly about events, people, governments, or companies based in an Asian country (e.g. China, Japan, South Korea, Taiwan, India, Southeast Asia). Asia does NOT include the Middle East. Do NOT assign "asia" just because a Western company has Asian operations, customers, or revenue exposure.
- Gaming articles must be categorized as "gaming" only. Do NOT add "technology" as a secondary category unless the article is specifically about a breakthrough in gaming technology (e.g. a new graphics API, hardware architecture, or AI advancement applied to games) — not a game release, studio news, or industry business story.

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
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

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
