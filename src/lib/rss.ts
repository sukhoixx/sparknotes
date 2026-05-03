import Parser from "rss-parser";
import type { Category } from "./ai";

export interface RawArticle {
  title: string;
  content: string;
  link: string;
  pubDate: Date;
  source: string;
}

const parser = new Parser({ timeout: 6000 });

const FEEDS: Record<Category, { url: string; source: string }[]> = {
  news: [
    { url: "https://feeds.bbci.co.uk/news/rss.xml",             source: "BBC News" },
    { url: "https://feeds.npr.org/1001/rss.xml",                source: "NPR" },
    { url: "https://www.theguardian.com/world/rss",             source: "The Guardian" },
    { url: "https://feeds.bbci.co.uk/news/world/rss.xml",       source: "BBC World" },
    { url: "https://rss.nytimes.com/services/xml/rss/nf/HomePage.xml", source: "NYT" },
  ],
  us: [
    { url: "https://rss.nytimes.com/services/xml/rss/nf/US.xml",       source: "NYT US" },
    { url: "https://feeds.npr.org/1003/rss.xml",                        source: "NPR US" },
    { url: "https://abcnews.go.com/abcnews/usheadlines",                source: "ABC News" },
    { url: "https://www.cbsnews.com/latest/rss/us",                     source: "CBS News" },
    { url: "https://feeds.reuters.com/Reuters/domesticNews",            source: "Reuters US" },
  ],
  politics: [
    { url: "https://rss.nytimes.com/services/xml/rss/nf/Politics.xml", source: "NYT Politics" },
    { url: "https://feeds.npr.org/1014/rss.xml",                        source: "NPR Politics" },
    { url: "https://www.politico.com/rss/politicopicks.xml",            source: "Politico" },
    { url: "https://thehill.com/feed/",                                 source: "The Hill" },
    { url: "https://rss.cnn.com/rss/cnn_allpolitics.rss",              source: "CNN Politics" },
  ],
  science: [
    { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", source: "BBC Science" },
    { url: "https://www.nasa.gov/rss/dyn/breaking_news.rss",    source: "NASA" },
    { url: "https://www.sciencedaily.com/rss/all.xml",          source: "ScienceDaily" },
    { url: "https://www.newscientist.com/feed/home/",           source: "New Scientist" },
    { url: "https://feeds.bbci.co.uk/news/health/rss.xml",      source: "BBC Health" },
  ],
  technology: [
    { url: "https://feeds.bbci.co.uk/news/technology/rss.xml",  source: "BBC Tech" },
    { url: "https://techcrunch.com/feed/",                      source: "TechCrunch" },
    { url: "https://www.wired.com/feed/rss",                    source: "Wired" },
    { url: "https://www.theverge.com/rss/index.xml",            source: "The Verge" },
    { url: "https://www.theguardian.com/us/technology/rss",     source: "Guardian Tech" },
  ],
  entertainment: [
    { url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", source: "BBC Entertainment" },
    { url: "https://www.theguardian.com/culture/rss",           source: "Guardian Culture" },
    { url: "https://variety.com/feed/",                         source: "Variety" },
    { url: "https://www.hollywoodreporter.com/feed/",           source: "Hollywood Reporter" },
    { url: "https://pitchfork.com/rss/news/feed.xml",           source: "Pitchfork" },
  ],
  sports: [
    { url: "https://feeds.bbci.co.uk/sport/rss.xml",            source: "BBC Sport" },
    { url: "https://www.theguardian.com/sport/rss",             source: "Guardian Sport" },
    { url: "https://www.espn.com/espn/rss/news",                source: "ESPN" },
    { url: "https://theathletic.com/rss/news/",                 source: "The Athletic" },
    { url: "https://feeds.skysports.com/skysports/home",        source: "Sky Sports" },
  ],
  business: [
    { url: "https://feeds.bbci.co.uk/news/business/rss.xml",    source: "BBC Business" },
    { url: "https://feeds.reuters.com/reuters/businessNews",    source: "Reuters Business" },
    { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC" },
    { url: "https://www.theguardian.com/business/rss",          source: "Guardian Business" },
    { url: "https://feeds.ft.com/rss/home/uk",                  source: "Financial Times" },
  ],
  gaming: [
    { url: "https://www.ign.com/rss/articles",                  source: "IGN" },
    { url: "https://kotaku.com/rss",                            source: "Kotaku" },
    { url: "https://www.pcgamer.com/rss/",                      source: "PC Gamer" },
    { url: "https://www.eurogamer.net/feed",                    source: "Eurogamer" },
    { url: "https://www.rockpapershotgun.com/feed",             source: "Rock Paper Shotgun" },
  ],
  travel: [
    { url: "https://www.theguardian.com/travel/rss",            source: "Guardian Travel" },
    { url: "https://www.lonelyplanet.com/news/feed/",           source: "Lonely Planet" },
    { url: "https://feeds.feedburner.com/travelchannel/news",   source: "Travel Channel" },
    { url: "https://www.atlasobscura.com/feeds/latest",         source: "Atlas Obscura" },
    { url: "https://www.nationalgeographic.com/travel/feed/",   source: "Nat Geo Travel" },
  ],
  animals: [
    { url: "https://www.theguardian.com/environment/animals/rss", source: "Guardian Animals" },
    { url: "https://www.smithsonianmag.com/rss/",               source: "Smithsonian" },
    { url: "https://www.iflscience.com/rss",                    source: "IFLScience" },
    { url: "https://www.zmescience.com/feed/",                  source: "ZME Science" },
    { url: "https://feeds.bbci.co.uk/earth/rss.xml",            source: "BBC Earth" },
  ],
  inventions: [
    { url: "https://www.popularmechanics.com/rss/all.xml/",     source: "Popular Mechanics" },
    { url: "https://hackaday.com/blog/feed/",                   source: "Hackaday" },
    { url: "https://interestingengineering.com/feed",           source: "Interesting Engineering" },
    { url: "https://spectrum.ieee.org/feeds/feed.rss",          source: "IEEE Spectrum" },
    { url: "https://makezine.com/feed/",                        source: "Make Magazine" },
  ],
};

const FEED_TIMEOUT_MS = 6000;

async function fetchFeed(url: string, source: string, cutoff: Date): Promise<RawArticle[]> {
  try {
    const feed = await Promise.race([
      parser.parseURL(url),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("feed timeout")), FEED_TIMEOUT_MS)
      ),
    ]);
    return feed.items
      .filter((item) => item.pubDate && new Date(item.pubDate) >= cutoff)
      .map((item) => ({
        title: item.title ?? "",
        content: item.contentSnippet ?? item.summary ?? item.title ?? "",
        link: item.link ?? "",
        pubDate: new Date(item.pubDate!),
        source,
      }))
      .filter((a) => a.title.length > 10 && a.link);
  } catch {
    return [];
  }
}

export async function fetchArticlesByCategory(category: Category, days = 14): Promise<RawArticle[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const feeds = FEEDS[category];

  const results = await Promise.allSettled(
    feeds.map(({ url, source }) => fetchFeed(url, source, cutoff))
  );

  const articles: RawArticle[] = [];
  const seenUrls = new Set<string>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const article of result.value) {
        if (!seenUrls.has(article.link)) {
          seenUrls.add(article.link);
          articles.push(article);
        }
      }
    }
  }

  return articles.sort(() => Math.random() - 0.5);
}
