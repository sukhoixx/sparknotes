import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

export async function POST(req: NextRequest) {
  const { url, title } = await req.json();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  // Fetch full article text via Jina Reader
  let articleText = "";
  try {
    const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
      headers: { "Accept": "text/plain", "User-Agent": "Mozilla/5.0 (compatible; NewsBlock/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    articleText = await jinaRes.text();
    // Trim to ~6000 chars to stay within token budget
    articleText = articleText.slice(0, 6000);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 502 });
  }

  if (!articleText || articleText.length < 100) {
    return NextResponse.json({ error: "Article content too short or unavailable" }, { status: 422 });
  }

  // Generate summary via DeepSeek
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";
  try {
    const res = await client.chat.completions.create({
      model,
      max_tokens: 800,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: `You are a clear, factual journalist summarizing news articles. Write a 2-3 paragraph summary in plain English.
Rules:
- Only include facts explicitly stated in the article. Do NOT invent details, quotes, statistics, or events not in the source.
- Write in direct, confident prose. No hedging phrases like "the article says" or "according to the report".
- Keep each paragraph focused: what happened, why it matters, what comes next.
- Return plain text only — no HTML, no markdown, no bullet points.`,
        },
        {
          role: "user",
          content: `Title: ${title}\n\nArticle:\n${articleText}`,
        },
      ],
    });

    const summary = res.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ summary, articleText });
  } catch (err) {
    return NextResponse.json({ error: "AI summarization failed" }, { status: 500 });
  }
}
