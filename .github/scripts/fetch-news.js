const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = process.argv[2] || path.join(__dirname, '../../frontend/public/news.json');

// ─── Primary sources: Google News RSS ────────────────────────────────────────
// These are always accessible from GitHub Actions and return valid XML.
// They aggregate articles from Kuwaiti & regional news sites.
const GOOGLE_NEWS_SOURCES = [
  { name: 'Google | الاقتصاد الكويتي', url: 'https://news.google.com/rss/search?q=الاقتصاد+الكويتي&hl=ar&gl=KW&ceid=KW:ar' },
  { name: 'Google | أسهم الكويت',      url: 'https://news.google.com/rss/search?q=أسهم+بورصة+الكويت&hl=ar&gl=KW&ceid=KW:ar' },
  { name: 'Google | نفط الكويت',       url: 'https://news.google.com/rss/search?q=نفط+أوبك+الكويت&hl=ar&gl=KW&ceid=KW:ar' },
  { name: 'Google | بنوك الكويت',      url: 'https://news.google.com/rss/search?q=بنوك+مصارف+الكويت&hl=ar&gl=KW&ceid=KW:ar' },
  { name: 'Google | عقارات الكويت',    url: 'https://news.google.com/rss/search?q=عقارات+الكويت&hl=ar&gl=KW&ceid=KW:ar' },
  { name: 'Google | Kuwait Economy',    url: 'https://news.google.com/rss/search?q=Kuwait+economy+finance&hl=en&gl=KW&ceid=KW:en' },
  { name: 'Google | Kuwait Oil',        url: 'https://news.google.com/rss/search?q=Kuwait+oil+OPEC&hl=en&gl=KW&ceid=KW:en' },
  { name: 'Google | Kuwait Stocks',     url: 'https://news.google.com/rss/search?q=Kuwait+Boursa+stock+exchange&hl=en&gl=KW&ceid=KW:en' },
  { name: 'Google | القبس',            url: 'https://news.google.com/rss/search?q=site:alqabas.com&hl=ar&gl=KW&ceid=KW:ar' },
  { name: 'Google | الأنباء',          url: 'https://news.google.com/rss/search?q=site:alanba.com.kw&hl=ar&gl=KW&ceid=KW:ar' },
  { name: 'Google | مناقصات الكويت',   url: 'https://news.google.com/rss/search?q=مناقصات+عطاءات+الكويت+حكومية&hl=ar&gl=KW&ceid=KW:ar' },
  { name: 'Google | Kuwait Tenders',   url: 'https://news.google.com/rss/search?q=Kuwait+tenders+CAPT+government+procurement&hl=en&gl=KW&ceid=KW:en' },
];

// ─── Secondary sources: direct Kuwaiti RSS ───────────────────────────────────
// These may or may not work from GitHub Actions IPs, but we try anyway.
const DIRECT_SOURCES = [
  { name: 'الأنباء',         url: 'https://www.alanba.com.kw/rss/' },
  { name: 'الأنباء - اقتصاد', url: 'https://www.alanba.com.kw/rss/economy/' },
  { name: 'القبس',           url: 'https://www.alqabas.com/rss/' },
  { name: 'الراي',           url: 'https://www.alrai.com/rss/' },
  { name: 'الوطن',           url: 'https://www.alwatan.com.kw/rss/' },
  { name: 'الجريدة',         url: 'https://www.aljarida.com/rss/' },
  { name: 'Kuwait Times',    url: 'https://www.kuwaittimes.com/feed/' },
  { name: 'Arab Times',      url: 'https://www.arabtimesonline.com/rss/' },
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*;q=0.8',
  'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const clean = (s) =>
  String(s || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ').replace(/\s+/g, ' ').trim();

function detectCategory(text) {
  const t = (text || '').toLowerCase();
  if (t.match(/سهم|أسهم|بورصة|stock|shares|تداول|مؤشر|إغلاق|ارتفاع|انخفاض|سوق الأوراق|ipo|boursa/)) return 'أسهم';
  if (t.match(/نفط|برميل|oil|opec|خام|أوبك|بترول|طاقة|gas|غاز|lng/)) return 'نفط';
  if (t.match(/بنك|مصرف|bank|فائدة|قرض|ائتمان|تمويل|مصارف|central bank/)) return 'بنوك';
  if (t.match(/عقار|real estate|property|مشروع|مجمع|أراضي|شقق|عقارات/)) return 'عقارات';
  if (t.match(/ذهب|gold|معدن|فضة|silver|نحاس|copper|platinum/)) return 'معادن';
  if (t.match(/مناقصة|مناقصات|عطاء|عطاءات|مزايدة|ممارسة|تلزيم|tender|procurement|مشتريات حكومية|capt|جهاز المناقصات/)) return 'مناقصات';
  if (t.match(/كويت|kuwait|حكومة|وزير|أمير|مجلس الأمة|ديوان|amiri/)) return 'كويت';
  return 'عام';
}

// Parse RSS XML — try strict first, then lenient (strict: false handles malformed feeds)
async function parseRSSXml(xmlData, sourceName) {
  for (const strict of [true, false]) {
    try {
      const parser = new xml2js.Parser({ explicitArray: false, trim: true, strict });
      const result = await parser.parseStringPromise(xmlData);

      const channel = result?.rss?.channel || result?.feed;
      if (!channel) {
        if (!strict) console.error(`  [no channel] ${sourceName}`);
        return [];
      }

      let items = channel.item || channel.entry;
      if (!items) return [];
      if (!Array.isArray(items)) items = [items];

      return items.map((item) => {
        const rawTitle = item.title?._ ?? (typeof item.title === 'string' ? item.title : '') ?? '';
        const rawDesc =
          item['content:encoded']?._ ?? item['content:encoded'] ??
          item.description?._ ?? item.description ??
          item.summary?._ ?? item.summary ?? '';

        // Google News RSS wraps link in CDATA inside the item — handle both formats
        const link =
          item.link?.href ??
          item.link?.$?.href ??
          (typeof item.link === 'string' ? item.link : '') ??
          item.guid?._ ??
          (typeof item.guid === 'string' ? item.guid : '') ?? '';

        const pubDate = item.pubDate ?? item.updated ?? item.published ?? new Date().toISOString();

        // Source attribution (Google News RSS provides a <source> element)
        const itemSource =
          item.source?._ ??
          (typeof item.source === 'string' ? item.source : null) ??
          sourceName;

        const title = clean(rawTitle);
        const description = clean(rawDesc).substring(0, 600);
        if (!title) return null;

        // Extract image
        let image = null;
        const descStr = String(rawDesc);
        const imgMatch = descStr.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch?.[1] && !imgMatch[1].includes('emoji') && !imgMatch[1].includes('avatar')) {
          image = imgMatch[1];
        }
        if (!image && item.enclosure) {
          const eu = item.enclosure?.$?.url ?? item.enclosure?.url;
          if (eu && /\.(jpg|jpeg|png|webp)/i.test(eu)) image = eu;
        }
        if (!image && item['media:content']) {
          const mu = item['media:content']?.$?.url ?? item['media:content']?.url;
          if (mu) image = mu;
        }

        const category = detectCategory(`${title} ${description}`);
        const dateMs = new Date(pubDate).getTime();
        const safeDate = isNaN(dateMs) ? Date.now() : dateMs;
        const id = `${sourceName}-${safeDate}-${Math.random().toString(36).slice(2, 7)}`;

        return {
          id, title, description,
          link: typeof link === 'string' ? link : '',
          pubDate: new Date(safeDate).toISOString(),
          image, category,
          source: itemSource,
        };
      }).filter(Boolean);
    } catch (e) {
      if (strict) {
        // Silently retry with lenient parser
      } else {
        console.error(`  [xml error] ${sourceName}: ${e.message.split('\n')[0]}`);
        return [];
      }
    }
  }
  return [];
}

async function fetchSource(source, timeout = 15000) {
  try {
    const resp = await axios.get(source.url, { timeout, headers: HEADERS, maxRedirects: 5 });
    const articles = await parseRSSXml(resp.data, source.name);
    console.error(`  ${articles.length > 0 ? '✓' : '!'} ${source.name}: ${articles.length} articles`);
    return articles;
  } catch (e) {
    console.error(`  ✗ ${source.name}: ${e.message.split('\n')[0]}`);
    return [];
  }
}

async function main() {
  const allSources = [...GOOGLE_NEWS_SOURCES, ...DIRECT_SOURCES];
  console.error(`Fetching ${allSources.length} sources (${GOOGLE_NEWS_SOURCES.length} Google News + ${DIRECT_SOURCES.length} direct)...`);

  const results = await Promise.allSettled(allSources.map((s) => fetchSource(s)));

  const allArticles = [];
  const seen = new Set();

  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const a of r.value) {
        const key = a.title.slice(0, 60).trim();
        if (key && !seen.has(key)) {
          seen.add(key);
          allArticles.push(a);
        }
      }
    }
  }

  // Sort newest first
  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  const output = {
    success: true,
    total: allArticles.length,
    fetchedAt: new Date().toISOString(),
    data: allArticles,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output));
  console.error(`Done: ${allArticles.length} articles → ${OUTPUT_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
