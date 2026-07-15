import { prisma } from "@/lib/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Quiet hours: don't send between 11pm and 7am PT (UTC-7)
function isQuietHours(): boolean {
  const utcHour = new Date().getUTCHours();
  const ptHour = (utcHour - 7 + 24) % 24; // PT = UTC-7 (PDT)
  return ptHour >= 23 || ptHour < 7;
}

export async function sendBreakingNewsPush(postId: number, title: string, snippet: string) {
  if (isQuietHours()) {
    console.log("[push] skipping — quiet hours");
    return;
  }

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
