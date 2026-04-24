const axios = require('axios');
const xml2js = require('xml2js');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = process.argv[2] || path.join(__dirname, '../../frontend/public/news.json');

// ─── Google News RSS (economy & business — NOT tenders) ──────────────────────
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
];

// ─── Direct newspaper RSS ─────────────────────────────────────────────────────
const DIRECT_SOURCES = [
  { name: 'الأنباء',          url: 'https://www.alanba.com.kw/rss/' },
  { name: 'الأنباء - اقتصاد', url: 'https://www.alanba.com.kw/rss/economy/' },
  { name: 'القبس',            url: 'https://www.alqabas.com/rss/' },
  { name: 'الراي',            url: 'https://www.alrai.com/rss/' },
  { name: 'الوطن',            url: 'https://www.alwatan.com.kw/rss/' },
  { name: 'الجريدة',          url: 'https://www.aljarida.com/rss/' },
  { name: 'Kuwait Times',     url: 'https://www.kuwaittimes.com/feed/' },
  { name: 'Arab Times',       url: 'https://www.arabtimesonline.com/rss/' },
];

// ─── Kuwait Al-Youm via Google News (backup) ──────────────────────────────────
const KUWAIT_YOUM_RSS_SOURCES = [
  { name: 'Google | كويت اليوم مناقصات', url: 'https://news.google.com/rss/search?q=site:kuwaityoum.gov.kw+مناقصات&hl=ar&gl=KW&ceid=KW:ar' },
  { name: 'Google | كويت اليوم ممارسات', url: 'https://news.google.com/rss/search?q=site:kuwaityoum.gov.kw+ممارسات&hl=ar&gl=KW&ceid=KW:ar' },
  { name: 'Google | كويت اليوم',         url: 'https://news.google.com/rss/search?q=site:kuwaityoum.gov.kw&hl=ar&gl=KW&ceid=KW:ar' },
  { name: 'Google | ممارسات الكويت',     url: 'https://news.google.com/rss/search?q=%22ممارسة%22+%22كويت+اليوم%22+2026&hl=ar&gl=KW&ceid=KW:ar' },
  { name: 'Google | مناقصات CAPT',       url: 'https://news.google.com/rss/search?q=site:capt.gov.kw&hl=ar&gl=KW&ceid=KW:ar' },
];

const RSS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*;q=0.8',
  'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
};

const HTML_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
  'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clean = (s) =>
  String(s || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ').replace(/\s+/g, ' ').trim();

function detectCategory(text) {
  const t = (text || '').toLowerCase();
  if (t.match(/سهم|أسهم|بورصة|stock|shares|تداول|مؤشر|إغلاق|ارتفاع|انخفاض|ipo|boursa/)) return 'أسهم';
  if (t.match(/نفط|برميل|oil|opec|خام|أوبك|بترول|طاقة|gas|غاز|lng/)) return 'نفط';
  if (t.match(/بنك|مصرف|bank|فائدة|قرض|ائتمان|تمويل|مصارف|central bank/)) return 'بنوك';
  if (t.match(/عقار|real estate|property|مجمع|أراضي|شقق|عقارات/)) return 'عقارات';
  if (t.match(/ذهب|gold|معدن|فضة|silver|نحاس|copper|platinum/)) return 'معادن';
  if (t.match(/مناقصة|مناقصات|عطاء|عطاءات|مزايدة|ممارسة|ممارسات|تلزيم|tender|procurement|capt|جهاز المناقصات|كويت اليوم/)) return 'مناقصات';
  if (t.match(/كويت|kuwait|حكومة|وزير|أمير|مجلس الأمة|ديوان|amiri/)) return 'كويت';
  return 'عام';
}

function makeArticle(title, description, link, source, pubDate) {
  const titleClean = clean(title);
  if (!titleClean || titleClean.length < 5) return null;
  const category = detectCategory(titleClean + ' ' + (description || ''));
  const dateMs = pubDate ? new Date(pubDate).getTime() : Date.now();
  const safeDate = isNaN(dateMs) ? Date.now() : dateMs;
  return {
    id: source + '-' + safeDate + '-' + Math.random().toString(36).slice(2, 7),
    title: titleClean,
    description: clean(description || '').substring(0, 600),
    link: String(link || ''),
    pubDate: new Date(safeDate).toISOString(),
    image: null,
    category,
    source,
  };
}

// ─── RSS parser ───────────────────────────────────────────────────────────────

async function parseRSSXml(xmlData, sourceName) {
  for (const strict of [true, false]) {
    try {
      const parser = new xml2js.Parser({ explicitArray: false, trim: true, strict });
      const result = await parser.parseStringPromise(xmlData);
      const channel = result?.rss?.channel || result?.feed;
      if (!channel) { if (!strict) console.error('  [no channel] ' + sourceName); return []; }
      let items = channel.item || channel.entry;
      if (!items) return [];
      if (!Array.isArray(items)) items = [items];

      return items.map((item) => {
        const rawTitle = item.title?._ ?? (typeof item.title === 'string' ? item.title : '') ?? '';
        const rawDesc = item['content:encoded']?._ ?? item['content:encoded'] ?? item.description?._ ?? item.description ?? item.summary?._ ?? item.summary ?? '';
        const link = item.link?.href ?? item.link?.$?.href ?? (typeof item.link === 'string' ? item.link : '') ?? item.guid?._ ?? (typeof item.guid === 'string' ? item.guid : '') ?? '';
        const pubDate = item.pubDate ?? item.updated ?? item.published ?? new Date().toISOString();
        const itemSource = item.source?._ ?? (typeof item.source === 'string' ? item.source : null) ?? sourceName;
        const title = clean(rawTitle);
        const description = clean(rawDesc).substring(0, 600);
        if (!title) return null;
        let image = null;
        const imgMatch = String(rawDesc).match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch?.[1] && !imgMatch[1].includes('emoji') && !imgMatch[1].includes('avatar')) image = imgMatch[1];
        if (!image && item.enclosure) { const eu = item.enclosure?.$?.url ?? item.enclosure?.url; if (eu && /\.(jpg|jpeg|png|webp)/i.test(eu)) image = eu; }
        if (!image && item['media:content']) { const mu = item['media:content']?.$?.url ?? item['media:content']?.url; if (mu) image = mu; }
        const category = detectCategory(title + ' ' + description);
        const dateMs = new Date(pubDate).getTime();
        const safeDate = isNaN(dateMs) ? Date.now() : dateMs;
        return { id: sourceName + '-' + safeDate + '-' + Math.random().toString(36).slice(2, 7), title, description, link: typeof link === 'string' ? link : '', pubDate: new Date(safeDate).toISOString(), image, category, source: itemSource };
      }).filter(Boolean);
    } catch (e) {
      if (strict) { /* retry */ } else { console.error('  [xml error] ' + sourceName + ': ' + e.message.split('\n')[0]); return []; }
    }
  }
  return [];
}

async function fetchRSSSource(source, timeout = 15000) {
  try {
    const resp = await axios.get(source.url, { timeout, headers: RSS_HEADERS, maxRedirects: 5 });
    const articles = await parseRSSXml(resp.data, source.name);
    console.error('  ' + (articles.length > 0 ? '✓' : '!') + ' ' + source.name + ': ' + articles.length + ' articles');
    return articles;
  } catch (e) {
    console.error('  ✗ ' + source.name + ': ' + e.message.split('\n')[0]);
    return [];
  }
}

// ─── CAPT HTML scraper (جهاز المناقصات المركزي) ──────────────────────────────
async function scrapeCAPT() {
  const urls = [
    'https://capt.gov.kw/ar/tenders/opening-tenders/',
    'https://capt.gov.kw/ar/tenders/',
    'https://capt.gov.kw/en/tenders/opening-tenders/',
  ];
  for (const url of urls) {
    try {
      const resp = await axios.get(url, { timeout: 30000, headers: HTML_HEADERS, maxRedirects: 5 });
      const $ = cheerio.load(resp.data);
      const articles = [];
      const seen = new Set();

      $('table tbody tr, table tr').each((i, row) => {
        const $row = $(row);
        const cells = $row.find('td').map((j, cell) => $(cell).text().trim()).get().filter(Boolean);
        if (cells.length < 2) return;
        const titleCell = cells.find(c => /[\u0600-\u06FF]/.test(c) && c.length > 8);
        if (!titleCell) return;
        const key = titleCell.slice(0, 80);
        if (seen.has(key)) return;
        seen.add(key);
        const href = $row.find('a').first().attr('href') || '';
        const fullLink = href.startsWith('http') ? href : href ? 'https://capt.gov.kw' + (href.startsWith('/') ? '' : '/') + href : url;
        const dateStr = cells.find(c => /\d{4}/.test(c));
        const art = makeArticle(titleCell, cells.filter(c => c !== titleCell).join(' | '), fullLink, 'CAPT | جهاز المناقصات', dateStr || null);
        if (art) articles.push(art);
      });

      if (articles.length === 0) {
        $('a, li').each((i, el) => {
          const $el = $(el);
          const text = $el.text().trim();
          if (!text || text.length < 10 || !/[\u0600-\u06FF]/.test(text)) return;
          if (!/مناقصة|ممارسة|عطاء|مزايدة|توريد/.test(text)) return;
          const key = text.slice(0, 80);
          if (seen.has(key)) return;
          seen.add(key);
          const href = ($el.is('a') ? $el : $el.find('a')).first().attr('href') || '';
          const fullLink = href.startsWith('http') ? href : href ? 'https://capt.gov.kw' + href : url;
          const art = makeArticle(text.slice(0, 200), '', fullLink, 'CAPT | جهاز المناقصات', null);
          if (art) articles.push(art);
        });
      }

      if (articles.length > 0) { console.error('  ✓ CAPT: ' + articles.length + ' tenders from ' + url); return articles; }
    } catch (e) { console.error('  ✗ CAPT (' + url + '): ' + e.message.split('\n')[0]); }
  }
  console.error('  ! CAPT: 0 tenders (site may be blocking GitHub IPs)');
  return [];
}

// ─── Kuwait Al-Youm official gazette scraper (كويت اليوم الرسمية) ────────────
async function scrapeKuwaitYoum() {
  const BASE = 'https://www.kuwaityoum.gov.kw';
  const urls = [
    BASE + '/',
    BASE + '/ar/',
    BASE + '/Pages/AR/Tenders.aspx',
    BASE + '/Pages/AR/Practices.aspx',
    BASE + '/ar/tenders',
    BASE + '/ar/practices',
  ];
  const allArticles = [];
  const seen = new Set();

  for (const url of urls) {
    try {
      const resp = await axios.get(url, { timeout: 30000, headers: HTML_HEADERS, maxRedirects: 5 });
      const $ = cheerio.load(resp.data);

      $('a').each((i, el) => {
        const $el = $(el);
        const text = $el.text().trim();
        const href = $el.attr('href') || '';
        if (!text || text.length < 8 || !/[\u0600-\u06FF]/.test(text)) return;
        if (!/مناقصة|ممارسة|عطاء|مزايدة|تلزيم|توريد|خدمات|إنشاء|تأمين/.test(text)) return;
        const key = text.slice(0, 80);
        if (seen.has(key)) return;
        seen.add(key);
        const fullLink = href.startsWith('http') ? href : href.startsWith('/') ? BASE + href : href ? BASE + '/' + href : url;
        const parentText = $el.closest('tr, li, div, article').text();
        const dateMatch = parentText.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}|\d{4}[\/\-]\d{2}[\/\-]\d{2}/);
        const art = makeArticle(text, '', fullLink, 'كويت اليوم | رسمي', dateMatch ? new Date(dateMatch[0]) : null);
        if (art) allArticles.push(art);
      });

      $('table tr').each((i, row) => {
        const $row = $(row);
        const cells = $row.find('td').map((j, cell) => $(cell).text().trim()).get().filter(Boolean);
        if (cells.length < 2) return;
        const titleCell = cells.find(c => /[\u0600-\u06FF]/.test(c) && c.length > 8 && /مناقصة|ممارسة|عطاء/.test(c));
        if (!titleCell) return;
        const key = titleCell.slice(0, 80);
        if (seen.has(key)) return;
        seen.add(key);
        const href = $row.find('a').first().attr('href') || '';
        const fullLink = href.startsWith('http') ? href : href ? BASE + (href.startsWith('/') ? '' : '/') + href : url;
        const dateStr = cells.find(c => /\d{4}/.test(c));
        const art = makeArticle(titleCell, cells.filter(c => c !== titleCell).join(' | '), fullLink, 'كويت اليوم | رسمي', dateStr || null);
        if (art) allArticles.push(art);
      });

    } catch (e) {
      if (!e.message.includes('404') && !e.message.includes('ENOTFOUND') && !e.message.includes('ECONNREFUSED')) {
        console.error('  ✗ كويت اليوم (' + url + '): ' + e.message.split('\n')[0]);
      }
    }
  }
  console.error('  ' + (allArticles.length > 0 ? '✓' : '!') + ' كويت اليوم: ' + allArticles.length + ' tenders');
  return allArticles;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.error('═══ Fetching Kuwait economic news & official tenders ═══');

  console.error('\n[RSS] Fetching feeds...');
  const rssResults = await Promise.allSettled([
    ...GOOGLE_NEWS_SOURCES.map(s => fetchRSSSource(s)),
    ...DIRECT_SOURCES.map(s => fetchRSSSource(s)),
    ...KUWAIT_YOUM_RSS_SOURCES.map(s => fetchRSSSource(s)),
  ]);

  console.error('\n[HTML] Scraping official tender portals...');
  const [captArticles, kuwaitYoumArticles] = await Promise.all([scrapeCAPT(), scrapeKuwaitYoum()]);

  const allArticles = [];
  const seen = new Set();

  // Official tender sources first (highest priority)
  for (const art of [...captArticles, ...kuwaitYoumArticles]) {
    if (!art) continue;
    const key = art.title.slice(0, 60).trim();
    if (key && !seen.has(key)) { seen.add(key); allArticles.push(art); }
  }

  // Then RSS articles
  for (const r of rssResults) {
    if (r.status !== 'fulfilled') continue;
    for (const a of r.value) {
      const key = a.title.slice(0, 60).trim();
      if (key && !seen.has(key)) { seen.add(key); allArticles.push(a); }
    }
  }

  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  const output = { success: true, total: allArticles.length, fetchedAt: new Date().toISOString(), data: allArticles };
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output));

  const officialCount = captArticles.length + kuwaitYoumArticles.length;
  console.error('\nDone: ' + allArticles.length + ' total → ' + OUTPUT_PATH);
  console.error('  • Official tenders (CAPT + كويت اليوم): ' + officialCount);
  console.error('  • RSS articles: ' + (allArticles.length - officialCount));
}

main().catch((e) => { console.error(e); process.exit(1); });
