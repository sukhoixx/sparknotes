import { NextRequest, NextResponse } from "next/server";
import { Converter } from "opencc-js";
import { prisma } from "@/lib/prisma";

const _toSimplified = Converter({ from: "tw", to: "cn" });
function toSimplified(text: string): string {
  const result = _toSimplified(text);
  if ([...result].length === [...text].length) return result;
  return [...text].map((ch) => {
    const c = _toSimplified(ch);
    return [...c].length === 1 ? c : ch;
  }).join("");
}
function cnField(s: string | null | undefined): string | null {
  return s ? toSimplified(s) : null;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await prisma.post.findMany({
    where: { zhBody: { not: null } },
    select: { id: true, zhTitle: true, zhSnippet: true, zhBody: true, zhFunFact: true },
  });

  let updated = 0;
  for (const post of posts) {
    const newTitleCn = cnField(post.zhTitle);
    const newSnippetCn = cnField(post.zhSnippet);
    const newBodyCn = cnField(post.zhBody);
    const newFunFactCn = cnField(post.zhFunFact);

    await prisma.post.update({
      where: { id: post.id },
      data: {
        zhTitleCn: newTitleCn,
        zhSnippetCn: newSnippetCn,
        zhBodyCn: newBodyCn,
        zhFunFactCn: newFunFactCn,
      },
    });
    updated++;
  }

  return NextResponse.json({ total: posts.length, updated });
}
