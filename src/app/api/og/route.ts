import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url).searchParams.get("url");
  if (!url) return NextResponse.json({ imageUrl: null });

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NewsBlock/1.0)",
        "Range": "bytes=0-16383",
      },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const imageUrl = match?.[1] ?? null;
    return NextResponse.json({ imageUrl }, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json({ imageUrl: null });
  }
}
