import Parser from "rss-parser";

export interface RawArticle {
  title: string;
  content: string;
  link: string;
  pubDate: Date;
  source: string;
}

const parser = new Parser({ timeout: 8000 });

const FEEDS = [
  { url: "https://feeds.bbci.co.uk/news/rss.xml", source: "BBC News" },
  { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", source: "BBC Science" },
  { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", source: "BBC Tech" },
  { url: "https://feeds.bbci.co.uk/sport/rss.xml", source: "BBC Sport" },
  { url: "https://feeds.npr.org/1001/rss.xml", source: "NPR" },
  { url: "https://www.nasa.gov/rss/dyn/breaking_news.rss", source: "NASA" },
  { url: "https://www.theguardian.com/world/rss", source: "The Guardian" },
];

export async function fetchRecentArticles(): Promise<RawArticle[]> {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const results = await Promise.allSettled(
    FEEDS.map(async ({ url, source }) => {
      const feed = await parser.parseURL(url);
      return feed.items
        .filter((item) => {
          if (!item.pubDate) return false;
          return new Date(item.pubDate) >= cutoff;
        })
        .map((item) => ({
          title: item.title ?? "",
          content: item.contentSnippet ?? item.summary ?? item.title ?? "",
          link: item.link ?? "",
          pubDate: new Date(item.pubDate!),
          source,
        }));
    })
  );

  const articles: RawArticle[] = [];
  const seenUrls = new Set<string>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const article of result.value) {
        if (article.link && !seenUrls.has(article.link) && article.title.length > 10) {
          seenUrls.add(article.link);
          articles.push(article);
        }
      }
    }
  }

  // Shuffle so we don't always take BBC articles first
  return articles.sort(() => Math.random() - 0.5);
}
