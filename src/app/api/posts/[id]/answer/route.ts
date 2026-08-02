import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deepseekCreate } from "@/lib/ai";

export const dynamic = "force-dynamic";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const postId = parseInt(params.id);
  if (isNaN(postId)) return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });

  const { question, lang } = await req.json().catch(() => ({}));
  if (!question) return NextResponse.json({ error: "question is required" }, { status: 400 });

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { title: true, body: true, zhBody: true, zhBodyCn: true },
  });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  // Use the body in the user's language for better context
  const body = lang === "zh-TW" && post.zhBody
    ? stripHtml(post.zhBody)
    : lang === "zh-CN" && post.zhBodyCn
    ? stripHtml(post.zhBodyCn)
    : stripHtml(post.body);

  const isZh = lang === "zh-TW" || lang === "zh-CN";
  const isTW = lang === "zh-TW";

  const systemPrompt = isZh
    ? `你是一位知識淵博的新聞助理。根據文章內容或相關知識，用${isTW ? "繁體中文" : "简体中文"}以一段話回答讀者的問題。回答應清晰、準確，適合高中生閱讀程度。若問題與文章提及的事件或人物完全無關，只需用一句話拒絕，不作任何解釋。`
    : "You are a knowledgeable news assistant. Answer the reader's question based on the article or using existing knowledge if applicable in one clear paragraph. Write for a high school reading level. If the question is completely unrelated to the event or persons mentioned in the article, reject it in one sentence only — no explanation.";

  const userPrompt = isZh
    ? `文章：${post.title}\n\n${body.slice(0, 2000)}\n\n問題：${question}`
    : `Article: ${post.title}\n\n${body.slice(0, 2000)}\n\nQuestion: ${question}`;

  try {
    const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";
    const res = await deepseekCreate({
      model,
      thinking: { type: "disabled" },
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const answer = res.choices[0]?.message?.content?.trim() ?? "";
    if (!answer) return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("[answer] error:", err);
    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}
