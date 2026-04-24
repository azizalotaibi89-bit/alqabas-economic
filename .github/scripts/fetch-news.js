const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = process.argv[2] || path.join(__dirname, '../../frontend/public/news.json');

const RSS_SOURCES = [
  { name: 'الأنباء', url: 'https://www.alanba.com.kw/rss/' },
  { name: 'الأنباء - اقتصاد', url: 'https://www.alanba.com.kw/rss/economy/' },
  { name: 'القبس', url: 'https://www.alqabas.com/rss/' },
  { name: 'الراي', url: 'https://www.alrai.com/rss/' },
  { name: 'الوطن', url: 'https://www.alwatan.com.kw/rss/' },
  { name: 'الجريدة', url: 'https://www.aljarida.com/rss/' },
  { name: 'كونا - اقتصاد', url: 'https://www.kuna.net.kw/rss/ArRss/ArRssEconomy.aspx' },
  { name: 'كونا', url: 'https://www.kuna.net.kw/rss/arrsshome.aspx' },
  { name: 'Kuwait Times', url: 'https://www.kuwaittimes.com/feed/' },
  { name: 'Arab Times', url: 'https://www.arabtimesonline.com/rss/' },
  { name: 'KUNA English', url: 'https://www.kuna.net.kw/rss/EnRss/EnRssEconomy.aspx' },
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*;q=0.8',
  'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
};

function detectCategory(text) {
  const t = (text || '').toLowerCase();
  if (t.match(/سهم|أسهم|بورصة|stock|shares|تداول|مؤشر|إغلاق|ارتفاع|انخفاض|تداولات|سوق الأوراق|ipo/)) return 'أسهم';
  if (t.match(/نفط|برميل|oil|opec|خام|أوبك|بترول|طاقة|gas|غاز|lng/)) return 'نفط';
  if (t.match(/بنك|مصرف|bank|فائدة|قرض|ائتمان|تمويل|مصارف|مالي|central bank/)) return 'بنوك';
  if (t.match(/عقار|real estate|property|مشروع|مجمع|أراضي|شقق|عقارات/)) return 'عقارات';
  if (t.match(/ذهب|gold|معدن|فضة|silver|نحاس|copper|platinum/)) return 'معادن';
  if (t.match(/كويت|kuwait|حكومة|وزير|أمير|مجلس الأمة|ديوان|amiri/)) return 'كويت';
  return 'عام';
}

const clean = (s) => String(s || '')
  .replace(/<![CDATA[|]]>/g, '')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ').replace(/\s+/g, ' ').trim();

async function parseRSSXml(xmlData, sourceName) {
  const parser = new xml2js.Parser({ explicitArray: false, trim: true });
  let result;
  try { result = await parser.parseStringPromise(xmlData); } catch (e) {
    console.error(`  [xml parse error] ${sourceName}: ${e.message}`);
    return [];
  }
  const channel = result?.rss?.channel || result?.feed;
  if (!channel) return [];
  let items = channel.item || channel.entry;
  if (!items) return [];
  if (!Array.isArray(items)) items = [items];

  return items.map((item) => {
    const rawTitle = item.title?._ ?? (typeof item.title === 'string' ? item.title : '') ?? '';
    const rawDesc =
      item['content:encoded']?._ ?? item['content:encoded'] ??
      item.description?._ ?? item.description ??
      item.summary?._ ?? item.summary ?? '';
    const link = item.link?.href ?? (typeof item.link === 'string' ? item.link : '') ?? item.guid?._ ?? item.guid ?? '';
    const pubDate = item.pubDate ?? item.updated ?? item.published ?? new Date().toISOString();
    const title = clean(rawTitle);
    const description = clean(rawDesc).substring(0, 600);
    if (!title) return null;
    let image = null;
    const imgMatch = String(rawDesc).match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1] && !imgMatch[1].includes('emoji')) image = imgMatch[1];
    if (!image && item.enclosure) {
      const eu = item.enclosure?.$?.url ?? item.enclosure?.url;
      if (eu && /\.(jpg|jpeg|png|webp)/i.test(eu)) image = eu;
    }
    if (!image && item['media:content']) {
      const mu = item['media:content']?.$?.url ?? item['media:content']?.url;
      if (mu) image = mu;
    }
    const dateMs = new Date(pubDate).getTime();
    const safeDate = isNaN(dateMs) ? Date.now() : dateMs;
    const id = `${sourceName}-${safeDate}-${Math.random().toString(36).slice(2, 7)}`;
    return { id, title, description, link, pubDate: new Date(safeDate).toISOString(), image,
      category: detectCategory(`${title} ${description}`), source: sourceName };
  }).filter(Boolean);
}

// Method 1: Direct fetch
async function fetchDirect(source) {
  const resp = await axios.get(source.url, { timeout: 15000, headers: HEADERS, maxRedirects: 5 });
  return await parseRSSXml(resp.data, source.name);
}

// Method 2: allorigins.win CORS proxy — fetches live from its servers, bypasses IP blocks
async function fetchViaAllOrigins(source) {
  const encoded = encodeURIComponent(source.url);
  const url = `https://api.allorigins.win/get?url=${encoded}`;
  const resp = await axios.get(url, { timeout: 20000 });
  if (!resp.data?.contents) throw new Error('allorigins: empty contents');
  return await parseRSSXml(resp.data.contents, source.name);
}

// Method 3: rss2json (no count param — free tier returns up to 10 items)
async function fetchViaRss2Json(source) {
  const encoded = encodeURIComponent(source.url);
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encoded}`;
  const resp = await axios.get(url, { timeout: 20000 });
  if (!resp.data || resp.data.status !== 'ok') {
    throw new Error(`rss2json: ${resp.data?.message || resp.data?.status || 'unknown error'}`);
  }
  return (resp.data.items || []).map((item) => {
    const title = clean(item.title);
    if (!title) return null;
    const description = clean(item.description || item.content || '').substring(0, 600);
    const dateMs = new Date(item.pubDate).getTime();
    const safeDate = isNaN(dateMs) ? Date.now() : dateMs;
    const id = `${source.name}-${safeDate}-${Math.random().toString(36).slice(2, 7)}`;
    return { id, title, description, link: item.link || '', pubDate: new Date(safeDate).toISOString(),
      image: item.thumbnail || item.enclosure?.link || null,
      category: detectCategory(`${title} ${description}`), source: source.name };
  }).filter(Boolean);
}

async function fetchSource(source) {
  // 1. Direct fetch
  try {
    const articles = await fetchDirect(source);
    if (articles.length > 0) {
      console.error(`  ✓ direct      ${source.name}: ${articles.length}`);
      return articles;
    }
    console.error(`  ! direct 0    ${source.name}: trying allorigins`);
  } catch (e) {
    console.error(`  ✗ direct      ${source.name}: ${e.message} → allorigins`);
  }

  // 2. allorigins.win proxy
  try {
    const articles = await fetchViaAllOrigins(source);
    if (articles.length > 0) {
      console.error(`  ✓ allorigins  ${source.name}: ${articles.length}`);
      return articles;
    }
    console.error(`  ! allorigins 0 ${source.name}: trying rss2json`);
  } catch (e) {
    console.error(`  ✗ allorigins  ${source.name}: ${e.message} → rss2json`);
  }

  // 3. rss2json (last resort)
  try {
    const articles = await fetchViaRss2Json(source);
    console.error(`  ✓ rss2json    ${source.name}: ${articles.length}`);
    return articles;
  } catch (e) {
    console.error(`  ✗ rss2json    ${source.name}: ${e.message}`);
    return [];
  }
}

async function main() {
  console.error(`Fetching ${RSS_SOURCES.length} RSS sources...`);
  const results = await Promise.allSettled(RSS_SOURCES.map(fetchSource));
  const allArticles = [];
  const seen = new Set();
  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const a of r.value) {
        const key = a.title.slice(0, 60);
        if (!seen.has(key)) { seen.add(key); allArticles.push(a); }
      }
    }
  }
  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const output = { success: true, total: allArticles.length, fetchedAt: new Date().toISOString(), data: allArticles };
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output));
  console.error(`Done: ${allArticles.length} articles → ${OUTPUT_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
