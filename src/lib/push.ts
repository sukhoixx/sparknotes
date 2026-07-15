import { prisma } from "@/lib/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function sendBreakingNewsPush(postId: number, title: string, snippet: string) {

  const tokens = await prisma.deviceToken.findMany({ select: { token: true } });
  if (tokens.length === 0) {
    console.log("[push] no device tokens registered");
    return;
  }

  const messages = tokens.map(({ token }) => ({
    to: token,
    title: "📰 Breaking News",
    body: title,
    subtitle: snippet.length > 80 ? snippet.slice(0, 80) + "…" : snippet,
    data: { postId },
    sound: "default",
    _contentAvailable: true,
    priority: "normal",
  }));

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
