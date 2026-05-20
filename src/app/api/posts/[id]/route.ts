import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/ai";
import type { Category } from "@/lib/ai";

let viewsColumnEnsured = false;
async function ensureViewsColumn() {
  if (viewsColumnEnsured) return;
  viewsColumnEnsured = true;
  await prisma.$executeRaw`
    ALTER TABLE \`Post\` ADD COLUMN IF NOT EXISTS \`views\` INT NOT NULL DEFAULT 0
  `.catch(() => {});
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS \`DailyViews\` (\`date\` DATE NOT NULL PRIMARY KEY, \`count\` INT NOT NULL DEFAULT 0)
  `.catch(() => {});
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  ensureViewsColumn().catch(() => {});

  const post = await prisma.post.findUnique({
    where: { id },
    include: { _count: { select: { comments: true } } },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  prisma.$executeRaw`UPDATE \`Post\` SET views = views + 1 WHERE id = ${id}`.catch(() => {});
  prisma.$executeRaw`
    INSERT INTO \`DailyViews\` (\`date\`, \`count\`) VALUES (${today}, 1)
    ON DUPLICATE KEY UPDATE \`count\` = \`count\` + 1
  `.catch(() => {});

  const meta = CATEGORY_META[post.category as Category] ?? CATEGORY_META["news"];
  const result = {
    ...post,
    gradient: meta.gradient,
    badge: meta.badge,
    authorEmoji: meta.authorEmoji,
    authorBg: meta.authorBg,
    tags: Array.isArray(post.tags) ? post.tags : JSON.parse(post.tags as string),
    categories: Array.isArray(post.categories) ? post.categories : JSON.parse(post.categories as string),
  };

  return NextResponse.json({ post: result });
}
