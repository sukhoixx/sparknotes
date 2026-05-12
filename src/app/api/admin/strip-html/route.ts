import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await prisma.post.findMany({ select: { id: true, title: true, snippet: true } });

  let updated = 0;
  for (const post of posts) {
    const cleanTitle = stripHtml(post.title);
    const cleanSnippet = stripHtml(post.snippet);
    if (cleanTitle !== post.title || cleanSnippet !== post.snippet) {
      await prisma.post.update({
        where: { id: post.id },
        data: { title: cleanTitle, snippet: cleanSnippet },
      });
      updated++;
    }
  }

  return NextResponse.json({ total: posts.length, updated });
}
