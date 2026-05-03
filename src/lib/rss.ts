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
    { url: "https://feeds.bbci.co.uk/news/rss.xml",                    source: "BBC News" },
    { url: "https://feeds.npr.org/1001/rss.xml",                       source: "NPR" },
    { url: "https://www.theguardian.com/world/rss",                    source: "The Guardian" },
    { url: "https://feeds.bbci.co.uk/news/world/rss.xml",              source: "BBC World" },
    { url: "https://rss.nytimes.com/services/xml/rss/nf/HomePage.xml", source: "NYT" },
    { url: "https://feeds.reuters.com/reuters/topNews",                source: "Reuters" },
    { url: "https://feeds.apnews.com/rss/apf-topnews",                source: "AP News" },
    { url: "https://www.cbsnews.com/latest/rss/main",                  source: "CBS News" },
    { url: "https://time.com/feed/",                                   source: "Time" },
    { url: "https://api.axios.com/feed/",                              source: "Axios" },
  ],
  world: [
    { url: "https://feeds.reuters.com/Reuters/worldNews",              source: "Reuters World" },
    { url: "https://www.aljazeera.com/xml/rss/all.xml",               source: "Al Jazeera" },
    { url: "https://feeds.apnews.com/rss/apf-topnews",                source: "AP News" },
    { url: "https://rss.dw.com/xml/rw_en",                            source: "Deutsche Welle" },
    { url: "https://www.france24.com/en/rss",                         source: "France 24" },
    { url: "https://feeds.bbci.co.uk/news/world/rss.xml",             source: "BBC World" },
    { url: "https://www.theguardian.com/world/rss",                   source: "Guardian World" },
    { url: "https://foreignpolicy.com/feed/",                         source: "Foreign Policy" },
    { url: "https://www.euronews.com/rss",                            source: "Euronews" },
    { url: "https://feeds.skynews.com/feeds/rss/world.xml",           source: "Sky News World" },
  ],
  us: [
    { url: "https://rss.nytimes.com/services/xml/rss/nf/US.xml",      source: "NYT US" },
    { url: "https://feeds.npr.org/1003/rss.xml",                      source: "NPR US" },
    { url: "https://abcnews.go.com/abcnews/usheadlines",              source: "ABC News" },
    { url: "https://www.cbsnews.com/latest/rss/us",                   source: "CBS News" },
    { url: "https://feeds.reuters.com/Reuters/domesticNews",          source: "Reuters US" },
    { url: "https://rssfeeds.usatoday.com/usatoday-NewsTopStories",   source: "USA Today" },
    { url: "https://feeds.nbcnews.com/nbcnews/public/news",           source: "NBC News" },
    { url: "https://www.politico.com/rss/politicopicks.xml",          source: "Politico" },
    { url: "https://api.axios.com/feed/",                             source: "Axios" },
    { url: "https://feeds.skynews.com/feeds/rss/us.xml",             source: "Sky News US" },
  ],
  politics: [
    { url: "https://rss.nytimes.com/services/xml/rss/nf/Politics.xml", source: "NYT Politics" },
    { url: "https://feeds.npr.org/1014/rss.xml",                      source: "NPR Politics" },
    { url: "https://www.politico.com/rss/politicopicks.xml",          source: "Politico" },
    { url: "https://thehill.com/feed/",                               source: "The Hill" },
    { url: "https://rss.cnn.com/rss/cnn_allpolitics.rss",            source: "CNN Politics" },
    { url: "https://www.vox.com/rss/politics/index.xml",             source: "Vox Politics" },
    { url: "https://rollcall.com/feed/",                              source: "Roll Call" },
    { url: "https://feeds.washingtonpost.com/rss/politics",          source: "Washington Post" },
    { url: "https://api.axios.com/feed/",                            source: "Axios Politics" },
    { url: "https://www.realclearpolitics.com/index.xml",            source: "RealClearPolitics" },
  ],
  military: [
    { url: "https://www.defensenews.com/arc/outboundfeeds/rss/",      source: "Defense News" },
    { url: "https://www.militarytimes.com/arc/outboundfeeds/rss/",    source: "Military Times" },
    { url: "https://taskandpurpose.com/feed/",                        source: "Task & Purpose" },
    { url: "https://warontherocks.com/feed/",                         source: "War on the Rocks" },
    { url: "https://breakingdefense.com/feed/",                       source: "Breaking Defense" },
    { url: "https://www.stripes.com/arc/outboundfeeds/rss/",         source: "Stars and Stripes" },
    { url: "https://nationalinterest.org/rss.xml",                   source: "National Interest" },
    { url: "https://www.wearethemighty.com/feed/",                   source: "We Are The Mighty" },
    { url: "https://www.armytimes.com/arc/outboundfeeds/rss/",       source: "Army Times" },
    { url: "https://www.lawfaremedia.org/feed",                      source: "Lawfare" },
  ],
  science: [
    { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", source: "BBC Science" },
    { url: "https://www.nasa.gov/rss/dyn/breaking_news.rss",         source: "NASA" },
    { url: "https://www.sciencedaily.com/rss/all.xml",               source: "ScienceDaily" },
    { url: "https://www.newscientist.com/feed/home/",                source: "New Scientist" },
    { url: "https://www.space.com/feeds/all",                        source: "Space.com" },
    { url: "https://spaceflightnow.com/feed/",                       source: "SpaceflightNow" },
    { url: "https://feeds.arstechnica.com/arstechnica/science",      source: "Ars Technica Science" },
    { url: "https://www.scientificamerican.com/feed/",               source: "Scientific American" },
    { url: "https://www.livescience.com/feeds/all",                  source: "Live Science" },
    { url: "https://www.discovermagazine.com/rss",                   source: "Discover Magazine" },
  ],
  technology: [
    { url: "https://feeds.bbci.co.uk/news/technology/rss.xml",       source: "BBC Tech" },
    { url: "https://techcrunch.com/feed/",                           source: "TechCrunch" },
    { url: "https://www.wired.com/feed/rss",                         source: "Wired" },
    { url: "https://www.theverge.com/rss/index.xml",                 source: "The Verge" },
    { url: "https://venturebeat.com/category/ai/feed/",              source: "VentureBeat AI" },
    { url: "https://www.technologyreview.com/feed/",                 source: "MIT Tech Review" },
    { url: "https://feeds.arstechnica.com/arstechnica/index",        source: "Ars Technica" },
    { url: "https://www.engadget.com/rss.xml",                       source: "Engadget" },
    { url: "https://www.zdnet.com/news/rss.xml",                     source: "ZDNet" },
    { url: "https://www.theguardian.com/us/technology/rss",          source: "Guardian Tech" },
  ],
  celebrity: [
    { url: "https://people.com/feed/",                                 source: "People" },
    { url: "https://www.eonline.com/syndication/feeds/rssfeeds/news.xml", source: "E! News" },
    { url: "https://www.tmz.com/rss.xml",                              source: "TMZ" },
    { url: "https://pagesix.com/feed/",                                source: "Page Six" },
    { url: "https://www.justjared.com/feed/",                          source: "Just Jared" },
    { url: "https://hollywoodlife.com/feed/",                          source: "Hollywood Life" },
    { url: "https://www.etonline.com/rss/all_content.rss",            source: "Entertainment Tonight" },
    { url: "https://www.usmagazine.com/rss/",                         source: "Us Weekly" },
    { url: "https://www.celebitchy.com/feed/",                        source: "Celebitchy" },
    { url: "https://perezhilton.com/feed/",                           source: "Perez Hilton" },
  ],
  entertainment: [
    { url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", source: "BBC Entertainment" },
    { url: "https://www.theguardian.com/culture/rss",                source: "Guardian Culture" },
    { url: "https://variety.com/feed/",                              source: "Variety" },
    { url: "https://www.hollywoodreporter.com/feed/",               source: "Hollywood Reporter" },
    { url: "https://pitchfork.com/rss/news/feed.xml",               source: "Pitchfork" },
    { url: "https://deadline.com/feed/",                            source: "Deadline" },
    { url: "https://people.com/feed/",                              source: "People" },
    { url: "https://www.eonline.com/syndication/feeds/rssfeeds/news.xml", source: "E! News" },
    { url: "https://www.rollingstone.com/music/music-news/feed/",   source: "Rolling Stone" },
    { url: "https://tvline.com/feed/",                              source: "TVLine" },
  ],
  sports: [
    { url: "https://feeds.bbci.co.uk/sport/rss.xml",                source: "BBC Sport" },
    { url: "https://www.theguardian.com/sport/rss",                 source: "Guardian Sport" },
    { url: "https://www.espn.com/espn/rss/news",                    source: "ESPN" },
    { url: "https://theathletic.com/rss/news/",                     source: "The Athletic" },
    { url: "https://feeds.skysports.com/skysports/home",            source: "Sky Sports" },
    { url: "https://bleacherreport.com/articles/feed",              source: "Bleacher Report" },
    { url: "https://www.si.com/rss/si_topstories.rss",             source: "Sports Illustrated" },
    { url: "https://www.cbssports.com/rss/headlines/",              source: "CBS Sports" },
    { url: "https://sports.yahoo.com/rss/",                        source: "Yahoo Sports" },
    { url: "https://www.nbcsports.com/rss",                        source: "NBC Sports" },
  ],
  business: [
    { url: "https://feeds.bbci.co.uk/news/business/rss.xml",        source: "BBC Business" },
    { url: "https://feeds.reuters.com/reuters/businessNews",        source: "Reuters Business" },
    { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC" },
    { url: "https://www.theguardian.com/business/rss",              source: "Guardian Business" },
    { url: "https://feeds.ft.com/rss/home/uk",                     source: "Financial Times" },
    { url: "https://www.forbes.com/real-time/feed2/",              source: "Forbes" },
    { url: "https://www.inc.com/rss/",                             source: "Inc." },
    { url: "https://feeds.hbr.org/harvardbusiness",                source: "Harvard Business Review" },
    { url: "https://www.fastcompany.com/latest/rss",               source: "Fast Company" },
    { url: "https://fortune.com/feed/",                            source: "Fortune" },
  ],
  gaming: [
    { url: "https://www.ign.com/rss/articles",                     source: "IGN" },
    { url: "https://kotaku.com/rss",                               source: "Kotaku" },
    { url: "https://www.pcgamer.com/rss/",                         source: "PC Gamer" },
    { url: "https://www.eurogamer.net/feed",                       source: "Eurogamer" },
    { url: "https://www.rockpapershotgun.com/feed",                source: "Rock Paper Shotgun" },
    { url: "https://www.polygon.com/rss/index.xml",               source: "Polygon" },
    { url: "https://www.gamespot.com/feeds/news/",                source: "GameSpot" },
    { url: "https://www.vg247.com/feed",                          source: "VG247" },
    { url: "https://www.destructoid.com/feed/",                   source: "Destructoid" },
    { url: "https://www.gamesindustry.biz/rss",                   source: "GamesIndustry.biz" },
  ],
  travel: [
    { url: "https://www.theguardian.com/travel/rss",               source: "Guardian Travel" },
    { url: "https://www.lonelyplanet.com/news/feed/",              source: "Lonely Planet" },
    { url: "https://www.atlasobscura.com/feeds/latest",            source: "Atlas Obscura" },
    { url: "https://www.nationalgeographic.com/travel/feed/",      source: "Nat Geo Travel" },
    { url: "https://www.cntraveler.com/feed/rss",                  source: "Condé Nast Traveler" },
    { url: "https://www.travelandleisure.com/rss",                 source: "Travel+Leisure" },
    { url: "https://www.afar.com/feeds/afar-rss-feed",            source: "Afar" },
    { url: "https://thepointsguy.com/feed/",                      source: "The Points Guy" },
    { url: "https://www.fodors.com/news/feed",                    source: "Fodor's" },
    { url: "https://www.smarrertravel.com/feed",                  source: "Smarter Travel" },
  ],
  animals: [
    { url: "https://www.theguardian.com/environment/animals/rss",  source: "Guardian Animals" },
    { url: "https://www.smithsonianmag.com/rss/",                  source: "Smithsonian" },
    { url: "https://www.iflscience.com/rss",                       source: "IFLScience" },
    { url: "https://www.zmescience.com/feed/",                     source: "ZME Science" },
    { url: "https://feeds.bbci.co.uk/earth/rss.xml",              source: "BBC Earth" },
    { url: "https://www.livescience.com/feeds/all",               source: "Live Science" },
    { url: "https://news.mongabay.com/feed/",                     source: "Mongabay" },
    { url: "https://www.nationalgeographic.com/animals/feed/",    source: "Nat Geo Animals" },
    { url: "https://www.worldwildlife.org/press-releases.rss",    source: "WWF" },
    { url: "https://www.audubon.org/rss.xml",                     source: "Audubon Society" },
  ],
  finance: [
    { url: "https://feeds.marketwatch.com/marketwatch/topstories/", source: "MarketWatch" },
    { url: "https://www.investopedia.com/feedbuilder/feed/getfeed?feedName=rss_headline", source: "Investopedia" },
    { url: "https://www.fool.com/feeds/index.aspx",                source: "Motley Fool" },
    { url: "https://www.kiplinger.com/rss",                        source: "Kiplinger" },
    { url: "https://seekingalpha.com/feed.xml",                    source: "Seeking Alpha" },
    { url: "https://feeds.reuters.com/reuters/businessNews",       source: "Reuters Finance" },
    { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC" },
    { url: "https://feeds.bloomberg.com/markets/news.rss",         source: "Bloomberg Markets" },
    { url: "https://www.forbes.com/investing/feed/",               source: "Forbes Investing" },
    { url: "https://feeds.ft.com/rss/home/uk",                    source: "Financial Times" },
  ],
  health: [
    { url: "https://rss.webmd.com/rss/rss.aspx?RSSSource=RS_WEBMD_0", source: "WebMD" },
    { url: "https://www.medpagetoday.com/rss/headlines.xml",       source: "MedPage Today" },
    { url: "https://www.psychologytoday.com/us/rss",               source: "Psychology Today" },
    { url: "https://www.mindful.org/feed/",                        source: "Mindful" },
    { url: "https://www.wellandgood.com/feed/",                    source: "Well+Good" },
    { url: "https://www.medicalnewstoday.com/rss",                 source: "Medical News Today" },
    { url: "https://www.health.harvard.edu/blog/feed",             source: "Harvard Health" },
    { url: "https://www.everydayhealth.com/rss/",                  source: "Everyday Health" },
    { url: "https://www.verywellhealth.com/rss",                   source: "Verywell Health" },
    { url: "https://feeds.bbci.co.uk/news/health/rss.xml",        source: "BBC Health" },
  ],
  beauty: [
    { url: "https://www.allure.com/feed/rss",                      source: "Allure" },
    { url: "https://www.vogue.com/feed/rss",                       source: "Vogue" },
    { url: "https://wwd.com/feed/",                                source: "WWD" },
    { url: "https://www.harpersbazaar.com/rss/all.xml",            source: "Harper's Bazaar" },
    { url: "https://www.refinery29.com/rss.xml",                   source: "Refinery29" },
    { url: "https://www.instyle.com/rss",                          source: "InStyle" },
    { url: "https://fashionista.com/feed",                         source: "Fashionista" },
    { url: "https://www.cosmopolitan.com/rss/all.xml",             source: "Cosmopolitan" },
    { url: "https://www.elle.com/rss/all.xml",                     source: "Elle" },
    { url: "https://www.byrdie.com/rss",                           source: "Byrdie" },
  ],
  inventions: [
    { url: "https://www.popularmechanics.com/rss/all.xml/",        source: "Popular Mechanics" },
    { url: "https://hackaday.com/blog/feed/",                      source: "Hackaday" },
    { url: "https://interestingengineering.com/feed",              source: "Interesting Engineering" },
    { url: "https://spectrum.ieee.org/feeds/feed.rss",             source: "IEEE Spectrum" },
    { url: "https://makezine.com/feed/",                           source: "Make Magazine" },
    { url: "https://newatlas.com/index.rss",                       source: "New Atlas" },
    { url: "https://feeds.arstechnica.com/arstechnica/index",      source: "Ars Technica" },
    { url: "https://www.digitaltrends.com/feed/",                  source: "Digital Trends" },
    { url: "https://gizmodo.com/rss",                              source: "Gizmodo" },
    { url: "https://www.discovermagazine.com/rss",                 source: "Discover Magazine" },
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
