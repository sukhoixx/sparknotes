import { prisma } from "../src/lib/prisma";
import { translateToTraditionalChinese } from "../src/lib/ai";
import { Converter } from "opencc-js";

const _toSimplified = Converter({ from: "tw", to: "cn" });
function toSimplified(text: string): string {
  const result = _toSimplified(text);
  if (Array.from(result).length === Array.from(text).length) return result;
  return Array.from(text).map((ch) => {
    const c = _toSimplified(ch);
    return Array.from(c).length === 1 ? c : ch;
  }).join("");
}
function cnField(s: string | null | undefined): string | null {
  return s ? toSimplified(s) : null;
}
function decodeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;|&#0*39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
function stripHtml(s: string | null | undefined): string | null {
  return s ? decodeHtml(s.replace(/<[^>]*>/g, "")) : null;
}

const BATCH = 10;
const DELAY_MS = 1000;

async function main() {
  const posts = await prisma.post.findMany({
    where: { zhTitle: null },
    select: { id: true, title: true, snippet: true, body: true, funFact: true },
    orderBy: { createdAt: "desc" },
  });

  console.log(`[backfill-zh] ${posts.length} posts missing Chinese translation`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < posts.length; i += BATCH) {
    const batch = posts.slice(i, i + BATCH);
    await Promise.all(batch.map(async (post) => {
      let zh = await translateToTraditionalChinese(post);
      if (!zh) {
        console.log(`[backfill-zh] retry ${post.id}...`);
        zh = await translateToTraditionalChinese(post);
      }
      if (!zh) {
        console.log(`[backfill-zh] failed ${post.id}: ${post.title.slice(0, 50)}`);
        failed++;
        return;
      }
      await prisma.post.update({
        where: { id: post.id },
        data: {
          zhTitle: stripHtml(zh.zhTitle),
          zhSnippet: stripHtml(zh.zhSnippet),
          zhBody: zh.zhBody ?? null,
          zhFunFact: zh.zhFunFact ? decodeHtml(zh.zhFunFact) : null,
          zhTitleCn: cnField(stripHtml(zh.zhTitle) ?? zh.zhTitle),
          zhSnippetCn: cnField(stripHtml(zh.zhSnippet) ?? zh.zhSnippet),
          zhBodyCn: cnField(zh.zhBody),
          zhFunFactCn: zh.zhFunFact ? cnField(decodeHtml(zh.zhFunFact)) : null,
        },
      });
      success++;
      console.log(`[backfill-zh] ${success}/${posts.length} done: ${post.title.slice(0, 50)}`);
    }));

    if (i + BATCH < posts.length) await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(`[backfill-zh] complete: ${success} translated, ${failed} failed`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
