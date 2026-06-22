import Parser from "rss-parser";
import type { Category } from "./ai";

export interface RawArticle {
  title: string;
  content: string;
  fullContent: boolean; // true if content came from content:encoded (not just RSS snippet)
  link: string;
  pubDate: Date;
  source: string;
  imageUrl?: string;
}

const parser = new Parser({
  timeout: 6000,
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
    ],
  },
});

export const FEEDS: Record<Category, { url: string; source: string }[]> = {
  news: [
    { url: "https://feeds.bbci.co.uk/news/rss.xml",                    source: "BBC News" },
    { url: "https://feeds.npr.org/1001/rss.xml",                       source: "NPR" },
    { url: "https://www.theguardian.com/world/rss",                    source: "The Guardian" },
    { url: "https://rss.nytimes.com/services/xml/rss/nf/HomePage.xml", source: "NYT" },
    { url: "https://feeds.reuters.com/reuters/topNews",                source: "Reuters" },
    { url: "https://feeds.apnews.com/rss/apf-topnews",                source: "AP News" },
    { url: "https://www.cbsnews.com/latest/rss/main",                  source: "CBS News" },
    { url: "https://time.com/feed/",                                   source: "Time" },
    { url: "https://api.axios.com/feed/",                              source: "Axios" },
    { url: "https://rss.cnn.com/rss/cnn_topstories.rss",              source: "CNN" },
    { url: "https://feeds.washingtonpost.com/rss/national",            source: "Washington Post" },
    { url: "https://www.theatlantic.com/feed/all/",                    source: "The Atlantic" },
    { url: "https://www.huffpost.com/section/front-page/feed",         source: "HuffPost" },
    { url: "https://www.newsweek.com/rss",                             source: "Newsweek" },
    { url: "https://www.independent.co.uk/rss",                        source: "The Independent" },
    { url: "https://theweek.com/rss",                                  source: "The Week" },
    { url: "https://feeds.nbcnews.com/nbcnews/public/news",            source: "NBC News" },
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
    { url: "https://feeds.skynews.com/feeds/rss/world.xml",           source: "Sky News World" },
    { url: "https://rss.nytimes.com/services/xml/rss/nf/World.xml",   source: "NYT World" },
    { url: "https://thediplomat.com/feed/",                            source: "The Diplomat" },
    { url: "https://theconversation.com/us/articles.atom",             source: "The Conversation" },
    { url: "https://feeds.feedburner.com/rsscna/engnews/",             source: "Focus Taiwan" },
    { url: "https://www.taipeitimes.com/xml/index.rss",                source: "Taipei Times" },
    { url: "https://www.scmp.com/rss/91/feed/",                        source: "SCMP" },
    { url: "https://hongkongfp.com/feed/",                             source: "HK Free Press" },
    { url: "https://www.straitstimes.com/rss.xml",                     source: "Straits Times" },
    { url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6311", source: "CNA Singapore" },
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
    { url: "https://feeds.washingtonpost.com/rss/national",           source: "Washington Post" },
    { url: "https://www.latimes.com/local/rss2.0.xml",               source: "LA Times" },
    { url: "https://www.theatlantic.com/feed/all/",                   source: "The Atlantic" },
    { url: "https://feeds.propublica.org/propublica/main",            source: "ProPublica" },
    { url: "https://theintercept.com/feed/?rss",                      source: "The Intercept" },
    { url: "https://www.vox.com/rss/index.xml",                       source: "Vox" },
    { url: "https://www.huffpost.com/section/front-page/feed",        source: "HuffPost" },
    { url: "https://www.newsweek.com/rss",                            source: "Newsweek" },
    { url: "https://feeds.themarshallproject.org/marshall-project-stories.rss", source: "The Marshall Project" },
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
    { url: "https://www.realclearpolitics.com/index.xml",            source: "RealClearPolitics" },
    { url: "https://www.theatlantic.com/feed/all/",                  source: "The Atlantic" },
    { url: "https://www.nationalreview.com/feed/",                   source: "National Review" },
    { url: "https://www.motherjones.com/feed/",                      source: "Mother Jones" },
    { url: "https://www.thenation.com/feed/?post_type=article",      source: "The Nation" },
    { url: "https://slate.com/feeds/all.rss",                        source: "Slate" },
    { url: "https://feeds.feedburner.com/rsscna/engnews/",           source: "Focus Taiwan" },
    { url: "https://www.taipeitimes.com/xml/index.rss",              source: "Taipei Times" },
    { url: "https://www.scmp.com/rss/91/feed/",                      source: "SCMP" },
    { url: "https://hongkongfp.com/feed/",                           source: "HK Free Press" },
    { url: "https://www.straitstimes.com/rss.xml",                   source: "Straits Times" },
    { url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6311", source: "CNA Singapore" },
    { url: "https://theintercept.com/feed/?rss",                     source: "The Intercept" },
    { url: "https://talkingpointsmemo.com/feed/",                    source: "Talking Points Memo" },
    { url: "https://www.huffpost.com/section/politics/feed",         source: "HuffPost Politics" },
    { url: "https://www.governing.com/rss",                          source: "Governing" },
    { url: "https://fivethirtyeight.com/features/feed/",             source: "FiveThirtyEight" },
  ],
  military: [
    { url: "https://www.defensenews.com/arc/outboundfeeds/rss/",      source: "Defense News" },
    { url: "https://www.militarytimes.com/arc/outboundfeeds/rss/",    source: "Military Times" },
    { url: "https://taskandpurpose.com/feed/",                        source: "Task & Purpose" },
    { url: "https://warontherocks.com/feed/",                         source: "War on the Rocks" },
    { url: "https://breakingdefense.com/feed/",                       source: "Breaking Defense" },
    { url: "https://www.stripes.com/arc/outboundfeeds/rss/",         source: "Stars and Stripes" },
    { url: "https://nationalinterest.org/rss.xml",                   source: "National Interest" },
    { url: "https://www.lawfaremedia.org/feed",                      source: "Lawfare" },
    { url: "https://news.usni.org/feed",                             source: "USNI News" },
    { url: "https://www.defenseone.com/rss/all/",                    source: "Defense One" },
    { url: "https://www.airforcetimes.com/arc/outboundfeeds/rss/",   source: "Air Force Times" },
    { url: "https://www.navytimes.com/arc/outboundfeeds/rss/",       source: "Navy Times" },
    { url: "https://www.thedrive.com/the-war-zone/rss",              source: "The War Zone" },
    { url: "https://www.c4isrnet.com/arc/outboundfeeds/rss/",        source: "C4ISRNET" },
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
    { url: "https://www.nature.com/nature.rss",                      source: "Nature" },
    { url: "https://phys.org/rss-feed/",                             source: "Phys.org" },
    { url: "https://www.popsci.com/rss.xml",                         source: "Popular Science" },
    { url: "https://www.eurekalert.org/rss.xml",                     source: "EurekAlert" },
    { url: "https://www.quantamagazine.org/feed/",                   source: "Quanta Magazine" },
    { url: "https://cosmosmagazine.com/feed",                        source: "Cosmos Magazine" },
    { url: "https://www.sciencenews.org/feed",                       source: "Science News" },
    { url: "https://www.wired.com/category/science/feed/rss",        source: "Wired Science" },
    { url: "https://www.nationalgeographic.com/rss/",                source: "National Geographic" },
    { url: "https://theconversation.com/us/science/articles.atom",   source: "The Conversation Science" },
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
    { url: "https://www.theguardian.com/us/technology/rss",          source: "Guardian Tech" },
    { url: "https://www.cnet.com/rss/news/",                         source: "CNET" },
    { url: "https://9to5mac.com/feed/",                              source: "9to5Mac" },
    { url: "https://feeds.macrumors.com/MacRumors-All",              source: "MacRumors" },
    { url: "https://www.androidauthority.com/feed/",                 source: "Android Authority" },
    { url: "https://www.tomshardware.com/feeds/all",                 source: "Tom's Hardware" },
    { url: "https://thenextweb.com/feed/",                           source: "The Next Web" },
    { url: "https://mashable.com/feeds/rss/tech",                    source: "Mashable Tech" },
    { url: "https://www.windowscentral.com/rss.xml",                 source: "Windows Central" },
    { url: "https://www.techradar.com/rss",                          source: "TechRadar" },
  ],
  celebrity: [
    { url: "https://people.com/feed/",                                 source: "People" },
    { url: "https://www.tmz.com/rss.xml",                              source: "TMZ" },
    { url: "https://pagesix.com/feed/",                                source: "Page Six" },
    { url: "https://www.justjared.com/feed/",                          source: "Just Jared" },
    { url: "https://hollywoodlife.com/feed/",                          source: "Hollywood Life" },
    { url: "https://www.etonline.com/rss/all_content.rss",            source: "Entertainment Tonight" },
    { url: "https://www.usmagazine.com/rss/",                         source: "Us Weekly" },
    { url: "https://www.celebitchy.com/feed/",                        source: "Celebitchy" },
    { url: "https://perezhilton.com/feed/",                           source: "Perez Hilton" },
    { url: "https://www.dailymail.co.uk/tvshowbiz/index.rss",         source: "Daily Mail Showbiz" },
    { url: "https://okmagazine.com/feed/",                             source: "OK! Magazine" },
    { url: "https://radaronline.com/feed/",                            source: "Radar Online" },
    { url: "https://www.intouchweekly.com/feed/",                      source: "In Touch Weekly" },
    { url: "https://www.lifeandstylemag.com/feed/",                    source: "Life & Style" },
    { url: "https://www.accessonline.com/rss/articles",               source: "Access Hollywood" },
    { url: "https://www.hellomagazine.com/rss/",                       source: "Hello! Magazine" },
    { url: "https://starmagazine.com/feed/",                           source: "Star Magazine" },
    { url: "https://www.thedailybeast.com/entertainment/rss",         source: "Daily Beast Entertainment" },
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
    { url: "https://www.vulture.com/rss/all.xml",                   source: "Vulture" },
    { url: "https://www.avclub.com/rss",                            source: "AV Club" },
    { url: "https://www.thewrap.com/feed/",                         source: "The Wrap" },
    { url: "https://www.indiewire.com/feed/",                       source: "IndieWire" },
    { url: "https://collider.com/feed/",                            source: "Collider" },
    { url: "https://screenrant.com/feed/",                          source: "Screen Rant" },
    { url: "https://www.pastemagazine.com/rss",                     source: "Paste Magazine" },
    { url: "https://consequence.net/feed/",                         source: "Consequence of Sound" },
    { url: "https://ew.com/feed/",                                  source: "Entertainment Weekly" },
    { url: "https://uproxx.com/feed/",                              source: "Uproxx" },
  ],
  sports: [
    { url: "https://sports.yahoo.com/rss/",                        source: "Yahoo Sports" },
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
    { url: "https://www.entrepreneur.com/latest/rss.xml",          source: "Entrepreneur" },
    { url: "https://feeds.feedburner.com/businessinsider",         source: "Business Insider" },
    { url: "https://www.vox.com/rss/money/index.xml",              source: "Vox Money" },
    { url: "https://www.scmp.com/rss/5/feed/",                    source: "SCMP Business" },
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
    { url: "https://www.pushsquare.com/feeds/latest",             source: "Push Square" },
    { url: "https://www.nintendolife.com/feeds/latest",           source: "Nintendo Life" },
    { url: "https://www.dualshockers.com/feed/",                  source: "DualShockers" },
    { url: "https://wccftech.com/feed/",                          source: "Wccftech" },
    { url: "https://www.videogameschronicle.com/feed/",           source: "Video Game Chronicle" },
    { url: "https://toucharcade.com/feed/",                       source: "TouchArcade" },
    { url: "https://www.techradar.com/rss/news/gaming",           source: "TechRadar Gaming" },
    { url: "https://www.windowscentral.com/gaming/rss",           source: "Windows Central Gaming" },
    { url: "https://www.purexbox.com/feeds/latest",               source: "Pure Xbox" },
    { url: "https://www.siliconera.com/feed/",                    source: "Siliconera" },
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
    { url: "https://www.smartertravel.com/feed",                  source: "Smarter Travel" },
    { url: "https://matadornetwork.com/feed/",                    source: "Matador Network" },
    { url: "https://www.frommers.com/rss/articles",               source: "Frommer's" },
    { url: "https://www.nomadicmatt.com/feed/",                   source: "Nomadic Matt" },
    { url: "https://www.outsideonline.com/rss/",                  source: "Outside Magazine" },
    { url: "https://www.wanderlust.co.uk/feed/",                  source: "Wanderlust" },
    { url: "https://www.ricksteves.com/rss",                      source: "Rick Steves" },
    { url: "https://skift.com/feed/",                             source: "Skift" },
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
    { url: "https://www.thedodo.com/rss",                         source: "The Dodo" },
    { url: "https://janegoodall.org/feed/",                       source: "Jane Goodall Institute" },
    { url: "https://www.bornfree.org.uk/feed/",                   source: "Born Free Foundation" },
    { url: "https://www.onegreenplanet.org/feed/",                source: "One Green Planet" },
    { url: "https://www.aspca.org/rss.xml",                       source: "ASPCA" },
    { url: "https://defenders.org/rss",                           source: "Defenders of Wildlife" },
  ],
  finance: [
    { url: "https://feeds.marketwatch.com/marketwatch/topstories/", source: "MarketWatch" },
    { url: "https://www.investopedia.com/feedbuilder/feed/getfeed?feedName=rss_headline", source: "Investopedia" },
    { url: "https://www.fool.com/feeds/index.aspx",                source: "Motley Fool" },
    { url: "https://www.kiplinger.com/rss",                        source: "Kiplinger" },
    { url: "https://feeds.reuters.com/reuters/businessNews",       source: "Reuters Finance" },
    { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC" },
    { url: "https://feeds.bloomberg.com/markets/news.rss",         source: "Bloomberg Markets" },
    { url: "https://www.forbes.com/investing/feed/",               source: "Forbes Investing" },
    { url: "https://feeds.ft.com/rss/home/uk",                    source: "Financial Times" },
    { url: "https://finance.yahoo.com/rss/topstories",             source: "Yahoo Finance" },
    { url: "https://www.thestreet.com/rss/01_latest_news.xml",    source: "TheStreet" },
    { url: "https://www.nerdwallet.com/blog/feed/",                source: "NerdWallet" },
    { url: "https://www.thebalancemoney.com/rss",                  source: "The Balance" },
    { url: "https://www.bankrate.com/rss/",                        source: "Bankrate" },
    { url: "https://www.zacks.com/rss.php",                        source: "Zacks" },
    { url: "https://money.com/feed/",                              source: "Money" },
    { url: "https://www.scmp.com/rss/4/feed/",                    source: "SCMP Finance" },
  ],
  health: [
    { url: "https://rss.webmd.com/rss/rss.aspx?RSSSource=RS_WEBMD_0", source: "WebMD" },
    { url: "https://www.psychologytoday.com/us/rss",               source: "Psychology Today" },
    { url: "https://www.mindful.org/feed/",                        source: "Mindful" },
    { url: "https://www.wellandgood.com/feed/",                    source: "Well+Good" },
    { url: "https://www.medicalnewstoday.com/rss",                 source: "Medical News Today" },
    { url: "https://www.health.harvard.edu/blog/feed",             source: "Harvard Health" },
    { url: "https://www.everydayhealth.com/rss/",                  source: "Everyday Health" },
    { url: "https://www.verywellhealth.com/rss",                   source: "Verywell Health" },
    { url: "https://feeds.bbci.co.uk/news/health/rss.xml",        source: "BBC Health" },
    { url: "https://www.healthline.com/rss",                       source: "Healthline" },
    { url: "https://newsnetwork.mayoclinic.org/feed/",             source: "Mayo Clinic" },
    { url: "https://www.nih.gov/rss.xml",                          source: "NIH News" },
    { url: "https://www.who.int/rss-feeds/news-english.xml",       source: "WHO" },
    { url: "https://www.prevention.com/rss/all.xml",               source: "Prevention" },
    { url: "https://www.menshealth.com/rss/all.xml",               source: "Men's Health" },
    { url: "https://www.womenshealthmag.com/rss/all.xml",          source: "Women's Health" },
    { url: "https://www.shape.com/rss/all.xml",                    source: "Shape" },
    { url: "https://www.self.com/feed/rss",                        source: "Self" },
    { url: "https://www.runnersworld.com/rss/all.xml",             source: "Runner's World" },
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
    { url: "https://www.glamour.com/feed/rss",                     source: "Glamour" },
    { url: "https://www.teenvogue.com/feed/rss",                   source: "Teen Vogue" },
    { url: "https://www.nylon.com/rss",                            source: "Nylon" },
    { url: "https://intothegloss.com/feed/",                       source: "Into the Gloss" },
    { url: "https://www.whowhatwear.com/rss",                      source: "Who What Wear" },
    { url: "https://www.thecut.com/rss/",                          source: "The Cut" },
    { url: "https://www.popsugar.com/beauty/feed",                 source: "Popsugar Beauty" },
    { url: "https://coveteur.com/rss",                             source: "Coveteur" },
    { url: "https://www.glossy.co/feed/",                          source: "Glossy" },
    { url: "https://graziamagazine.com/us/feed/",                  source: "Grazia" },
  ],
  asia: [
    { url: "https://www.scmp.com/rss/91/feed/",                                                              source: "SCMP" },
    { url: "https://asia.nikkei.com/rss/feed/nar",                                                          source: "Nikkei Asia" },
    { url: "https://asiatimes.com/feed/",                                                                    source: "Asia Times" },
    { url: "https://thediplomat.com/feed/",                                                                  source: "The Diplomat" },
    { url: "https://feeds.reuters.com/Reuters/AsiaNews",                                                     source: "Reuters Asia" },
    { url: "https://www.koreaherald.com/common/rss.php",                                                     source: "Korea Herald" },
    { url: "https://www.taipeitimes.com/xml/index.rss",                                                      source: "Taipei Times" },
    { url: "https://www.taiwannews.com.tw/en/rss",                                                           source: "Taiwan News" },
    { url: "https://feeds.feedburner.com/rsscna/engnews/",                                                   source: "Focus Taiwan" },
    { url: "https://hongkongfp.com/feed/",                                                                   source: "HK Free Press" },
    { url: "https://www.straitstimes.com/rss.xml",                                                           source: "Straits Times" },
    { url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6311",             source: "CNA Singapore" },
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
    { url: "https://news.mit.edu/rss/feed",                        source: "MIT News" },
    { url: "https://futurism.com/feed",                            source: "Futurism" },
    { url: "https://singularityhub.com/feed/",                     source: "Singularity Hub" },
    { url: "https://www.sciencealert.com/feed",                    source: "ScienceAlert" },
    { url: "https://www.popsci.com/rss.xml",                       source: "Popular Science" },
    { url: "https://techxplore.com/rss-feed/",                     source: "TechXplore" },
    { url: "https://www.smithsonianmag.com/innovation/rss/",       source: "Smithsonian Innovation" },
    { url: "https://www.wired.com/category/innovation/feed/rss",   source: "Wired Innovation" },
    { url: "https://www.tomsguide.com/feeds/all",                  source: "Tom's Guide" },
  ],
};

const FEED_TIMEOUT_MS = 6000;
const IMAGE_CHECK_TIMEOUT_MS = 2000;
const IMAGE_MIN_BYTES = 5000;
const JINA_TIMEOUT_MS = 15000;
const JINA_MIN_LENGTH = 200;

// Fetch full article text via Jina AI reader for articles without content:encoded
export async function fetchFullArticle(url: string): Promise<string | null> {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const headers: Record<string, string> = {
      "Accept": "text/plain",
      "User-Agent": "Mozilla/5.0 (compatible; NewsBlock/1.0)",
      "X-Return-Format": "text",
    };
    if (process.env.JINA_API_KEY) headers["Authorization"] = `Bearer ${process.env.JINA_API_KEY}`;

    const res = await fetch(jinaUrl, { headers, signal: AbortSignal.timeout(JINA_TIMEOUT_MS) });
    if (!res.ok) return null;
    const text = await res.text();
    // Trim to 6000 chars — enough for a full article without burning tokens
    const trimmed = text.slice(0, 6000).trim();
    return trimmed.length >= JINA_MIN_LENGTH ? trimmed : null;
  } catch {
    return null;
  }
}

export async function fetchOgImage(articleUrl: string): Promise<string | null> {
  try {
    const res = await fetch(articleUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsBlock/1.0)", "Range": "bytes=0-16383" },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text().catch(() => "");
    // Ensure body is fully consumed / released
    await res.body?.cancel().catch(() => {});
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(IMAGE_CHECK_TIMEOUT_MS) });
    // Consume body so the connection is released back to the pool
    await res.body?.cancel();
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) return false;
    const cl = res.headers.get("content-length");
    if (cl && parseInt(cl, 10) < IMAGE_MIN_BYTES) return false;
    return true;
  } catch {
    return false;
  }
}

async function fetchFeed(url: string, source: string, cutoff: Date): Promise<RawArticle[]> {
  try {
    // Try fetch+parseString first so we can pass an AbortSignal.
    // Fall back to parseURL for feeds that block direct fetch (Reuters, AP, NYT etc.)
    let feed: Awaited<ReturnType<typeof parser.parseURL>>;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsBlock/1.0)" },
        signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
      });
      const xml = await res.text();
      feed = await parser.parseString(xml);
      if (feed.items.length === 0) throw new Error("empty feed");
    } catch {
      feed = await parser.parseURL(url);
    }
    const items = feed.items.filter((item) => item.pubDate && new Date(item.pubDate) >= cutoff);
    const articles = await Promise.all(
      items.map(async (item) => {
        const enclosureUrl = item.enclosure?.url;
        const rawImageUrl =
          (enclosureUrl && /\.(jpg|jpeg|png|webp|gif)/i.test(enclosureUrl) ? enclosureUrl : undefined) ??
          (item as any).mediaContent?.$?.url ??
          (item as any).mediaThumbnail?.$?.url ??
          undefined;
        const imageUrl = rawImageUrl && await isValidImageUrl(rawImageUrl) ? rawImageUrl : undefined;
        // Prefer full content:encoded body; fall back to snippet/summary/title.
        // Strip HTML tags so the AI receives clean prose.
        const encodedContent = (item as any).content as string | undefined;
        const hasFullContent = !!(encodedContent && encodedContent.length > 500);
        const rawContent = hasFullContent
          ? encodedContent!.replace(/<[^>]*>/g, " ").replace(/\s{2,}/g, " ").trim()
          : (item.contentSnippet ?? item.summary ?? item.title ?? "");

        return {
          title: (item.title ?? "").trim(),
          content: rawContent,
          fullContent: hasFullContent,
          link: (item.link ?? "").trim(),
          pubDate: new Date(item.pubDate!),
          source,
          ...(imageUrl ? { imageUrl } : {}),
        };
      })
    );
    const LOW_QUALITY_PATTERNS = [
      /news bulletin/i,
      /morning bulletin/i,
      /evening bulletin/i,
      /daily bulletin/i,
      /watch.{0,20}bulletin/i,
      /bulletin.{0,30}euronews/i,
      /access.{0,30}full.{0,20}bulletin/i,
    ];
    return articles.filter((a) =>
      a.title.length > 10 && a.link &&
      !LOW_QUALITY_PATTERNS.some((p) => p.test(a.title) || p.test(a.content))
    );
  } catch {
    return [];
  }
}

export async function fetchArticlesByCategory(category: Category, hours = 3): Promise<RawArticle[]> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
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

export async function fetchAllFeeds(days = 2): Promise<RawArticle[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const allFeeds = (Object.values(FEEDS) as { url: string; source: string }[][]).flat();
  const uniqueUrls = new Map<string, string>();
  for (const { url, source } of allFeeds) uniqueUrls.set(url, source);

  const results = await Promise.allSettled(
    Array.from(uniqueUrls.entries()).map(([url, source]) => fetchFeed(url, source, cutoff))
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
  return articles;
}

const STOPWORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with","by",
  "is","are","was","were","be","been","has","have","had","will","would","could",
  "should","may","might","it","its","this","that","as","from","not","no","up",
  "about","after","before","over","into","out","what","who","how","when","where",
  "why","which","new","says","say","after","amid","over","as","us",
]);

function titleWords(title: string): Set<string> {
  const words = title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return new Set(words);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  a.forEach((w) => { if (b.has(w)) intersection++; });
  return intersection / (a.size + b.size - intersection || 1);
}

// Filter out articles whose title is very similar (>= threshold) to a recently published post title,
// within the last windowHours. Prevents re-publishing the same story from a different source
// across generation runs, while allowing genuine follow-up stories (which have different titles).
export function filterRecentDuplicates(
  articles: RawArticle[],
  recentTitles: string[],
  threshold = 0.6,
): RawArticle[] {
  const recentWordSets = recentTitles.map(titleWords);
  return articles.filter((article) => {
    const words = titleWords(article.title);
    return !recentWordSets.some((recent) => jaccard(words, recent) >= threshold);
  });
}

// Cluster articles by headline similarity and return the top n most-covered stories.
// Each cluster = one story covered by multiple sources; bigger clusters = bigger news.
export function selectTopArticles(articles: RawArticle[], n: number): RawArticle[] {
  const wordSets = articles.map((a) => titleWords(a.title));
  const clusters: { indices: number[]; words: Set<string> }[] = [];

  for (let i = 0; i < articles.length; i++) {
    let bestCluster = -1;
    let bestSim = 0.18;
    for (let c = 0; c < clusters.length; c++) {
      const sim = jaccard(wordSets[i], clusters[c].words);
      if (sim > bestSim) { bestSim = sim; bestCluster = c; }
    }
    if (bestCluster >= 0) {
      clusters[bestCluster].indices.push(i);
      wordSets[i].forEach((w) => clusters[bestCluster].words.add(w));
    } else {
      clusters.push({ indices: [i], words: new Set(wordSets[i]) });
    }
  }

  clusters.sort((a, b) => b.indices.length - a.indices.length);

  const selected: RawArticle[] = [];
  for (const cluster of clusters) {
    if (selected.length >= n) break;
    // Pick the article with the most content as the representative
    const best = cluster.indices
      .map((i) => articles[i])
      .sort((a, b) => b.content.length - a.content.length)[0];
    selected.push(best);
  }

  return selected;
}
