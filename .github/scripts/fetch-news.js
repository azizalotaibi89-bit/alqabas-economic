const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = process.argv[2] || path.join(__dirname, '../../frontend/public/news.json');

const RSS_SOURCES = [
  { name: '\u0627\u0644\u0623\u0646\u0628\u0627\u0621', url: 'https://www.alanba.com.kw/rss/' },
  { name: '\u0627\u0644\u0623\u0646\u0628\u0627\u0621 - \u0627\u0642\u062a\u0635\u0627\u062f', url: 'https://www.alanba.com.kw/rss/economy/' },
  { name: '\u0627\u0644\u0642\u0628\u0633', url: 'https://www.alqabas.com/rss/' },
  { name: '\u0627\u0644\u0631\u0627\u064a', url: 'https://www.alrai.com/rss/' },
  { name: '\u0627\u0644\u0648\u0637\u0646', url: 'https://www.alwatan.com.kw/rss/' },
  { name: '\u0627\u0644\u062c\u0631\u064a\u062f\u0629', url: 'https://www.aljarida.com/rss/' },
  { name: '\u0643\u0648\u0646\u0627 - \u0627\u0642\u062a\u0635\u0627\u062f', url: 'https://www.kuna.net.kw/rss/ArRss/ArRssEconomy.aspx' },
  { name: '\u0643\u0648\u0646\u0627', url: 'https://www.kuna.net.kw/rss/arrsshome.aspx' },
  { name: 'Kuwait Times', url: 'https://www.kuwaittimes.com/feed/' },
  { name: 'Arab Times', url: 'https://www.arabtimesonline.com/rss/' },
  { name: 'KUNA English', url: 'https://www.kuna.net.kw/rss/EnRss/EnRssEconomy.aspx' },
];

function detectCategory(text) {
  const t = (text || '').toLowerCase();
  if (t.match(/\u0633\u0647\u0645|\u0623\u0633\u0647\u0645|\u0628\u0648\u0631\u0635\u0629|stock|shares|\u062a\u062f\u0627\u0648\u0644|\u0645\u0624\u0634\u0631|\u0625\u063a\u0644\u0627\u0642|\u0627\u0631\u062a\u0641\u0627\u0639|\u0627\u0646\u062e\u0641\u0627\u0636|ipo/)) return '\u0623\u0633\u0647\u0645';
  if (t.match(/\u0646\u0641\u0637|\u0628\u0631\u0645\u064a\u0644|oil|opec|\u062e\u0627\u0645|\u0623\u0648\u0628\u0643|\u0628\u062a\u0631\u0648\u0644|\u0637\u0627\u0642\u0629|gas|\u063a\u0627\u0632|lng/)) return '\u0646\u0641\u0637';
  if (t.match(/\u0628\u0646\u0643|\u0645\u0635\u0631\u0641|bank|\u0641\u0627\u0626\u062f\u0629|\u0642\u0631\u0636|\u0627\u0626\u062a\u0645\u0627\u0646|\u062a\u0645\u0648\u064a\u0644|\u0645\u0635\u0627\u0631\u0641|\u0645\u0627\u0644\u064a|central bank/)) return '\u0628\u0646\u0648\u0643';
  if (t.match(/\u0639\u0642\u0627\u0631|real estate|property|\u0645\u0634\u0631\u0648\u0639|\u0645\u062c\u0645\u0639|\u0623\u0631\u0627\u0636\u064a|\u0634\u0642\u0642|\u0639\u0642\u0627\u0631\u0627\u062a/)) return '\u0639\u0642\u0627\u0631\u0627\u062a';
  if (t.match(/\u0630\u0647\u0628|gold|\u0645\u0639\u062f\u0646|\u0641\u0636\u0629|silver|\u0646\u062d\u0627\u0633|copper|platinum/)) return '\u0645\u0639\u0627\u062f\u0646';
  if (t.match(/\u0643\u0648\u064a\u062a|kuwait|\u062d\u0643\u0648\u0645\u0629|\u0648\u0632\u064a\u0631|\u0623\u0645\u064a\u0631|\u0645\u062c\u0644\u0633 \u0627\u0644\u0623\u0645\u0629|\u062f\u064a\u0648\u0627\u0646|amiri/)) return '\u0643\u0648\u064a\u062a';
  return '\u0639\u0627\u0645';
}

async function parseRSSFeed(xmlData, sourceName) {
  const parser = new xml2js.Parser({ explicitArray: false, trim: true });
  let result;
  try { result = await parser.parseStringPromise(xmlData); } catch { return []; }
  const channel = result?.rss?.channel || result?.feed;
  if (!channel) return [];
  let items = channel.item || channel.entry;
  if (!items) return [];
  if (!Array.isArray(items)) items = [items];
  const clean = (s) => String(s || '').replace(/<![CDATA[|]]>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ').replace(/\s+/g, ' ').trim();
  return items.map((item) => {
    const rawTitle = item.title?._ ?? (typeof item.title === 'string' ? item.title : '') ?? '';
    const rawDesc = item['content:encoded']?._ ?? item['content:encoded'] ?? item.description?._ ?? item.description ?? item.summary?._ ?? item.summary ?? '';
    const link = item.link?.href ?? (typeof item.link === 'string' ? item.link : '') ?? item.guid?._ ?? item.guid ?? '';
    const pubDate = item.pubDate ?? item.updated ?? item.published ?? new Date().toISOString();
    const title = clean(rawTitle);
    const description = clean(rawDesc).substring(0, 600);
    if (!title) return null;
    let image = null;
    const descStr = String(rawDesc);
    const imgMatch = descStr.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1] && !imgMatch[1].includes('emoji')) image = imgMatch[1];
    if (!image && item.enclosure) { const eu = item.enclosure?.$?.url ?? item.enclosure?.url; if (eu && /\.(jpg|jpeg|png|webp)/i.test(eu)) image = eu; }
    if (!image && item['media:content']) { const mu = item['media:content']?.$?.url ?? item['media:content']?.url; if (mu) image = mu; }
    const category = detectCategory(title + ' ' + description);
    const dateMs = new Date(pubDate).getTime();
    const safeDate = isNaN(dateMs) ? Date.now() : dateMs;
    const id = sourceName + '-' + safeDate + '-' + Math.random().toString(36).slice(2, 7);
    return { id, title, description, link, pubDate: new Date(safeDate).toISOString(), image, category, source: sourceName };
  }).filter(Boolean);
}

async function fetchSource(source) {
  try {
    const resp = await axios.get(source.url, { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' } });
    return await parseRSSFeed(resp.data, source.name);
  } catch { return []; }
}

async function main() {
  console.error('Fetching ' + RSS_SOURCES.length + ' RSS sources...');
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
  console.error('Done: ' + allArticles.length + ' articles');
}

main().catch((e) => { console.error(e); process.exit(1); });
