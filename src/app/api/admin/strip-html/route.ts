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

  const posts = await prisma.post.findMany({
    select: { id: true, title: true, snippet: true, zhTitle: true, zhSnippet: true, zhTitleCn: true, zhSnippetCn: true },
  });

  let updated = 0;
  for (const post of posts) {
    const cleanTitle = stripHtml(post.title);
    const cleanSnippet = stripHtml(post.snippet);
    const cleanZhTitle = post.zhTitle ? stripHtml(post.zhTitle) : null;
    const cleanZhSnippet = post.zhSnippet ? stripHtml(post.zhSnippet) : null;
    const cleanZhTitleCn = post.zhTitleCn ? stripHtml(post.zhTitleCn) : null;
    const cleanZhSnippetCn = post.zhSnippetCn ? stripHtml(post.zhSnippetCn) : null;

    const needsUpdate =
      cleanTitle !== post.title ||
      cleanSnippet !== post.snippet ||
      cleanZhTitle !== post.zhTitle ||
      cleanZhSnippet !== post.zhSnippet ||
      cleanZhTitleCn !== post.zhTitleCn ||
      cleanZhSnippetCn !== post.zhSnippetCn;

    if (needsUpdate) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          title: cleanTitle,
          snippet: cleanSnippet,
          zhTitle: cleanZhTitle,
          zhSnippet: cleanZhSnippet,
          zhTitleCn: cleanZhTitleCn,
          zhSnippetCn: cleanZhSnippetCn,
        },
      });
      updated++;
    }
  }

  return NextResponse.json({ total: posts.length, updated });
}
