import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuestions } from "@/lib/ai";

export const dynamic = "force-dynamic";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const postId = parseInt(params.id);
  if (isNaN(postId)) return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });

  const questions = await prisma.postQuestion.findMany({
    where: { postId },
    orderBy: { id: "asc" },
    select: { id: true, question: true, questionZh: true, questionCn: true },
  });

  return NextResponse.json({ questions });
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const postId = parseInt(params.id);
  if (isNaN(postId)) return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });

  // Return cached questions if they already exist (idempotent)
  const existing = await prisma.postQuestion.findMany({
    where: { postId },
    orderBy: { id: "asc" },
    select: { id: true, question: true, questionZh: true, questionCn: true },
  });
  if (existing.length > 0) return NextResponse.json({ questions: existing });

  // Fetch the post to generate questions from
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { title: true, body: true },
  });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const result = await generateQuestions(post.title, stripHtml(post.body));
  if (!result || result.questions.length === 0) {
    return NextResponse.json({ questions: [] });
  }

  // Save questions to DB
  const created = await Promise.all(
    result.questions.map((q, i) =>
      prisma.postQuestion.create({
        data: {
          postId,
          question: q,
          questionZh: result.questionsZh[i] ?? null,
          questionCn: result.questionsCn[i] ?? null,
        },
        select: { id: true, question: true, questionZh: true, questionCn: true },
      })
    )
  );

  return NextResponse.json({ questions: created });
}
