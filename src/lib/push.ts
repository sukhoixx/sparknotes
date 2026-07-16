import { prisma } from "@/lib/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PostContent {
  postId: number;
  title: string;
  snippet: string;
  zhTitle?: string | null;
  zhSnippet?: string | null;
  zhTitleCn?: string | null;
  zhSnippetCn?: string | null;
}

export async function sendBreakingNewsPush(postId: number, title: string, snippet: string) {
  const tokens = await prisma.deviceToken.findMany({ select: { token: true, lang: true } });
  if (tokens.length === 0) {
    console.log("[push] no device tokens registered");
    return;
  }

  // Fetch Chinese titles if any users have zh preference
  const hasZh = tokens.some((t) => t.lang === "zh-TW" || t.lang === "zh-CN");
  let post: PostContent = { postId, title, snippet };
  if (hasZh) {
    const dbPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { zhTitle: true, zhSnippet: true, zhTitleCn: true, zhSnippetCn: true },
    });
    post = { ...post, ...dbPost };
  }

  const messages = tokens.map(({ token, lang }) => {
    let pushTitle = title;
    let pushBody = snippet;

    if (lang === "zh-TW" && post.zhTitle) {
      pushTitle = post.zhTitle;
      pushBody = post.zhSnippet ?? snippet;
    } else if (lang === "zh-CN" && (post.zhTitleCn ?? post.zhTitle)) {
      pushTitle = post.zhTitleCn ?? post.zhTitle ?? title;
      pushBody = post.zhSnippetCn ?? post.zhSnippet ?? snippet;
    }

    return {
      to: token,
      title: "📰 " + pushTitle,
      body: pushBody.length > 100 ? pushBody.slice(0, 100) + "…" : pushBody,
      data: { postId },
      sound: "default",
      priority: "normal",
      _contentAvailable: true,
    };
  });

  // Expo push API accepts up to 100 messages per request
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(batch),
      });
      const data = await res.json();
      console.log(`[push] sent batch ${Math.floor(i / 100) + 1}: ${JSON.stringify(data)}`);
    } catch (err) {
      console.error("[push] batch send failed:", err);
    }
  }
}
