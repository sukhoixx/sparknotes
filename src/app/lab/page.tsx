import Parser from "rss-parser";
import LabClient from "./LabClient";
import type { FeedItem } from "./LabClient";

const parser = new Parser({ timeout: 8000 });
const BBC_RSS = "https://feeds.bbci.co.uk/news/rss.xml";

export default async function LabPage() {
  let items: FeedItem[] = [];

  try {
    const feed = await parser.parseURL(BBC_RSS);
    items = feed.items.slice(0, 30).map((item) => ({
      title: item.title ?? "",
      link: item.link ?? "",
      pubDate: item.pubDate
        ? new Date(item.pubDate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
        : "",
      description: item.contentSnippet ?? item.summary ?? "",
    }));
  } catch {
    // Render with empty list — error shown in UI
  }

  return <LabClient items={items} />;
}
