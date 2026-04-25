const axios = require('axios');
const xml2js = require('xml2js');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const https = require('https');

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

// ─── Direct newspaper RSS (economy/business — tenders filtered by category) ──
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

const RSS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*;q=0.8',
  'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
};

const HTML_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
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
  if (t.match(/مناقصة|مناقصات|عطاء|عطاءات|مزايدة|ممارسة|ممارسات|تلزيم|tender|procurement|جهاز المناقصات|كويت اليوم/)) return 'مناقصات';
  if (t.match(/كويت|kuwait|حكومة|وزير|أمير|مجلس الأمة|ديوان|amiri/)) return 'كويت';
  return 'عام';
}

function makeArticle(title, description, link, source, pubDate) {
  const titleClean = clean(title);
  if (!titleClean || titleClean.length < 5) return null;
  const category = detectCategory(`${titleClean} ${description || ''}`);
  const dateMs = pubDate ? new Date(pubDate).getTime() : Date.now();
  const safeDate = isNaN(dateMs) ? Date.now() : dateMs;
  return {
    id: `${source}-${safeDate}-${Math.random().toString(36).slice(2, 7)}`,
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

        const link =
          item.link?.href ??
          item.link?.$?.href ??
          (typeof item.link === 'string' ? item.link : '') ??
          item.guid?._ ??
          (typeof item.guid === 'string' ? item.guid : '') ?? '';

        const pubDate = item.pubDate ?? item.updated ?? item.published ?? new Date().toISOString();
        const itemSource = item.source?._ ?? (typeof item.source === 'string' ? item.source : null) ?? sourceName;

        const title = clean(rawTitle);
        const description = clean(rawDesc).substring(0, 600);
        if (!title) return null;

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
      if (strict) { /* retry with lenient */ }
      else {
        console.error(`  [xml error] ${sourceName}: ${e.message.split('\n')[0]}`);
        return [];
      }
    }
  }
  return [];
}

async function fetchRSSSource(source, timeout = 15000) {
  try {
    const resp = await axios.get(source.url, { timeout, headers: RSS_HEADERS, maxRedirects: 5 });
    let articles = await parseRSSXml(resp.data, source.name);
    // Filter out garbled PDF files from CAPT file server (old dates, broken Arabic text)
    articles = articles.filter(a => !String(a.link || '').includes('files.capt.gov.kw'));
    console.error(`  ${articles.length > 0 ? '✓' : '!'} ${source.name}: ${articles.length} articles`);
    return articles;
  } catch (e) {
    console.error(`  ✗ ${source.name}: ${e.message.split('\n')[0]}`);
    return [];
  }
}

// ─── CAPT official tender scraper (جهاز المناقصات المركزي) ───────────────────
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

      // Strategy 1: table rows
      $('table tbody tr, table tr').each((i, row) => {
        const $row = $(row);
        const cells = $row.find('td').map((j, cell) => $(cell).text().trim()).get().filter(Boolean);
        if (cells.length < 2) return;

        // Find the main Arabic title cell
        const titleCell = cells.find(c => /[\u0600-\u06FF]/.test(c) && c.length > 8);
        if (!titleCell) return;
        const key = titleCell.slice(0, 80);
        if (seen.has(key)) return;
        seen.add(key);

        const $link = $row.find('a').first();
        const href = $link.attr('href') || '';
        const fullLink = href.startsWith('http') ? href : href ? `https://capt.gov.kw${href.startsWith('/') ? '' : '/'}${href}` : url;

        // Look for a date in the cells
        const dateStr = cells.find(c => /\d{4}/.test(c));
        const desc = cells.filter(c => c !== titleCell).join(' | ');

        const art = makeArticle(titleCell, desc, fullLink, 'CAPT | جهاز المناقصات', dateStr || null);
        if (art) articles.push(art);
      });

      // Strategy 2: named anchors / list items
      if (articles.length === 0) {
        $('a, li').each((i, el) => {
          const $el = $(el);
          const text = $el.text().trim();
          if (!text || text.length < 10 || !/[\u0600-\u06FF]/.test(text)) return;
          if (!/مناقصة|ممارسة|عطاء|مزايدة|تلزيم|توريد/.test(text)) return;
          const key = text.slice(0, 80);
          if (seen.has(key)) return;
          seen.add(key);

          const href = ($el.is('a') ? $el : $el.find('a')).first().attr('href') || '';
          const fullLink = href.startsWith('http') ? href : href ? `https://capt.gov.kw${href}` : url;
          const art = makeArticle(text.slice(0, 200), '', fullLink, 'CAPT | جهاز المناقصات', null);
          if (art) articles.push(art);
        });
      }

      if (articles.length > 0) {
        console.error(`  ✓ CAPT: ${articles.length} tenders from ${url}`);
        return articles;
      }
    } catch (e) {
      console.error(`  ✗ CAPT (${url}): ${e.message.split('\n')[0]}`);
    }
  }
  console.error('  ! CAPT: 0 tenders (site may be blocking GitHub IPs)');
  return [];
}

// ─── Kuwait Al-Youm authenticated API (كويت اليوم الرسمية — kuwaitalyawm.media.gov.kw) ───
const KY_ROOT = 'https://kuwaitalyawm.media.gov.kw';        // root — login form lives here
const KY_BASE = 'https://kuwaitalyawm.media.gov.kw/online'; // content — AdsCategory, etc.
// KY server has a self-signed / untrusted certificate — disable verification for these requests only
const KY_AGENT = new https.Agent({ rejectUnauthorized: false });

// Category definitions with estimated tender open-duration (days)
const KY_CATEGORIES = [
  { id: 1,  name: 'مناقصات', closeDays: 60 },
  { id: 2,  name: 'مزايدات', closeDays: 45 },
  { id: 18, name: 'ممارسات', closeDays: 21 },
];

async function loginKuwaitYoum() {
  const user = process.env.KUWAIT_YOUM_USER || '';
  const pass = process.env.KUWAIT_YOUM_PASS || '';
  if (!user || !pass) {
    console.error('  ! Kuwait Al-Youm: missing credentials (set KUWAIT_YOUM_USER / KUWAIT_YOUM_PASS)');
    return null;
  }

  const cookieJar = [];
  const mergeCookies = (headers) => {
    const raw = headers['set-cookie'] || [];
    raw.forEach(c => {
      const kv = c.split(';')[0];
      const name = kv.split('=')[0].trim();
      cookieJar[name] = kv;
    });
  };
  const cookieStr = () => Object.values(cookieJar).join('; ');

  try {
    // 1. GET root homepage → extract CSRF token (login form is on the root page)
    const loginUrl = `${KY_ROOT}/Account/LoginOnline`;
    const pageResp = await axios.get(`${KY_ROOT}/`, {
      timeout: 30000, headers: HTML_HEADERS, maxRedirects: 5, httpsAgent: KY_AGENT,
    });
    mergeCookies(pageResp.headers);
    const $lp = cheerio.load(pageResp.data);
    const token = $lp('input[name="__RequestVerificationToken"]').first().val();
    if (!token) throw new Error('no CSRF token on login page');

    // 2. POST credentials
    const loginBody = new URLSearchParams({
      UserName: user, Password: pass,
      RememberMe: 'false', __RequestVerificationToken: token,
    });
    const loginResp = await axios.post(loginUrl, loginBody.toString(), {
      timeout: 30000,
      headers: {
        ...HTML_HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieStr(), 'Referer': loginUrl,
      },
      maxRedirects: 5,
      validateStatus: s => s < 500,
      httpsAgent: KY_AGENT,
    });
    mergeCookies(loginResp.headers);

    // 3. Load category page to get a fresh CSRF token for DataTable calls
    const catResp = await axios.get(`${KY_BASE}/AdsCategory/1`, {
      timeout: 30000,
      headers: { ...HTML_HEADERS, 'Cookie': cookieStr() },
      maxRedirects: 5,
      httpsAgent: KY_AGENT,
    });
    mergeCookies(catResp.headers);
    const $cat = cheerio.load(catResp.data);
    const freshToken = $cat('input[name="__RequestVerificationToken"]').first().val();

    // Check we are actually logged in (page should show user sidebar)
    const isLoggedIn = catResp.data.includes('تسجيل الخروج') || catResp.data.includes('LogOffOnline')
                    || catResp.data.includes('AdsCategory');
    if (!isLoggedIn) throw new Error('login appeared to fail — not authenticated');

    console.error('  ✓ Kuwait Al-Youm: authenticated');
    return { cookies: cookieStr(), csrfToken: freshToken };

  } catch (e) {
    console.error(`  ✗ Kuwait Al-Youm login: ${e.message.split('\n')[0]}`);
    return null;
  }
}

async function fetchKuwaitYoumTenders(auth) {
  const articles = [];
  const LAST_N_ISSUES = 4;

  for (const cat of KY_CATEGORIES) {
    try {
      // Build DataTable POST body — sort by ID desc (newest first), fetch top 300
      const params = new URLSearchParams({
        draw: '1', start: '0', length: '300',
        '__RequestVerificationToken': auth.csrfToken,
        'search[value]': '', 'search[regex]': 'false',
        'columns[0][data]': 'AdsTitle',    'columns[0][name]': '', 'columns[0][searchable]': 'true',  'columns[0][orderable]': 'true',  'columns[0][search][value]': '', 'columns[0][search][regex]': 'false',
        'columns[1][data]': 'EditionNo',   'columns[1][name]': '', 'columns[1][searchable]': 'true',  'columns[1][orderable]': 'true',  'columns[1][search][value]': '', 'columns[1][search][regex]': 'false',
        'columns[2][data]': 'EditionDate', 'columns[2][name]': '', 'columns[2][searchable]': 'false', 'columns[2][orderable]': 'true',  'columns[2][search][value]': '', 'columns[2][search][regex]': 'false',
        'columns[3][data]': 'EditionID_FK','columns[3][name]': '', 'columns[3][searchable]': 'false', 'columns[3][orderable]': 'true',  'columns[3][search][value]': '', 'columns[3][search][regex]': 'false',
        'columns[4][data]': 'FromPage',    'columns[4][name]': '', 'columns[4][searchable]': 'false', 'columns[4][orderable]': 'false', 'columns[4][search][value]': '', 'columns[4][search][regex]': 'false',
        'columns[5][data]': 'ID',          'columns[5][name]': '', 'columns[5][searchable]': 'false', 'columns[5][orderable]': 'true',  'columns[5][search][value]': '', 'columns[5][search][regex]': 'false',
        'order[0][column]': '5', 'order[0][dir]': 'desc',
      });

      const resp = await axios.post(`${KY_BASE}/AdsCategoryJson/${cat.id}`, params.toString(), {
        timeout: 30000,
        headers: {
          ...HTML_HEADERS,
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'Cookie': auth.cookies,
          'Referer': `${KY_BASE}/AdsCategory/${cat.id}`,
        },
        httpsAgent: KY_AGENT,
      });

      const rows = resp.data?.data || [];
      if (!rows.length) { console.error(`  ! كويت اليوم ${cat.name}: 0 rows`); continue; }

      // Probe AdsDetails endpoint on the first row to find Arabic description source
      if (rows.length > 0 && cat.id === 1) { // only probe once (category 1 = مناقصات)
        const probeId = rows[0].ID;
        const detailUrls = [
          `${KY_BASE}/AdsDetails/${probeId}`,
          `${KY_BASE}/Ads/Details/${probeId}`,
          `${KY_BASE}/AdsInfo/${probeId}`,
        ];
        for (const dUrl of detailUrls) {
          try {
            const dr = await axios.get(dUrl, {
              timeout: 10000,
              headers: { ...HTML_HEADERS, Cookie: auth.cookies },
              httpsAgent: KY_AGENT,
              validateStatus: s => s < 500,
            });
            const snippet = String(dr.data || '').slice(0, 600).replace(/\s+/g, ' ');
            console.error(`  [KY detail probe ${dUrl}] status=${dr.status} snippet:`, snippet.slice(0, 300));
          } catch (pe) {
            console.error(`  [KY detail probe ${dUrl}] error: ${pe.message.split('\n')[0]}`);
          }
        }
      }

      // Collect the last N unique edition numbers from newest-first results
      const seenEditions = [];
      for (const r of rows) {
        if (!seenEditions.includes(r.EditionNo)) seenEditions.push(r.EditionNo);
        if (seenEditions.length >= LAST_N_ISSUES) break;
      }
      const targetEditions = new Set(seenEditions);

      let count = 0;
      for (const row of rows) {
        if (!targetEditions.has(row.EditionNo)) continue;

        // Parse /Date(ms)/ format
        const tsMatch = String(row.EditionDate).match(/\d+/);
        const pubDate = tsMatch ? new Date(parseInt(tsMatch[0])) : new Date();

        // Estimate deadline and urgency
        const estimatedClose = new Date(pubDate.getTime() + cat.closeDays * 86400000);
        const daysToClose = Math.ceil((estimatedClose.getTime() - Date.now()) / 86400000);
        const urgency = daysToClose < 14 ? 'urgent' : daysToClose < 30 ? 'medium' : 'normal';

        // Gazette PDF viewer URL
        const gazetteUrl = `https://kuwaitalyawm.media.gov.kw/flip/index?id=${row.EditionID_FK}&no=${row.FromPage}`;
        const tenderRef = String(row.AdsTitle || '').trim();

        // Title = reference code (AdsTitle is only a ref number; Arabic text not in DataTable API)
        const titleText = tenderRef || `${cat.name} — العدد ${row.EditionNo}`;

        // Description = metadata strip (pipe-separated for TendersSection.jsx parseMetaFromDesc)
        const desc = [cat.name, 'الكويت اليوم الرسمية', `العدد ${row.EditionNo}`, pubDate.toLocaleDateString('ar-KW'), `صفحة ${row.FromPage}`].join(' | ');

        const art = makeArticle(titleText, desc, gazetteUrl, 'كويت اليوم | رسمي', pubDate.toISOString());
        if (art) {
          art.urgency = urgency;
          art.daysToClose = daysToClose;
          art.tenderRef = tenderRef;
          art.editionNo = row.EditionNo;
          art.tenderCategory = cat.name;
          articles.push(art);
          count++;
        }
      }

      console.error(`  ✓ كويت اليوم ${cat.name}: ${count} tenders (issues ${[...targetEditions].join(', ')})`);
    } catch (e) {
      console.error(`  ✗ كويت اليوم ${cat.name}: ${e.message.split('\n')[0]}`);
    }
  }

  return articles;
}

// ─── Kuwait tender RSS — newspaper articles about live tenders ────────────────
// NOTE: site:capt.gov.kw returns old garbled PDFs. Use keyword searches instead.
const KUWAIT_YOUM_RSS_SOURCES = [
  { name: 'Google | مناقصات الكويت',  url: 'https://news.google.com/rss/search?q=مناقصات+جهاز+المناقصات+الكويت&hl=ar&gl=KW&ceid=KW:ar' },
  { name: 'Google | عطاءات ممارسات',  url: 'https://news.google.com/rss/search?q=عطاءات+ممارسات+مزايدات+الكويت&hl=ar&gl=KW&ceid=KW:ar' },
  { name: 'Google | Kuwait tenders',   url: 'https://news.google.com/rss/search?q=Kuwait+tender+procurement+2026&hl=en&gl=KW&ceid=KW:en' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.error('═══ Fetching Kuwait economic news & official tenders ═══');

  // 1. Run all RSS sources in parallel
  console.error(`\n[RSS] Fetching ${GOOGLE_NEWS_SOURCES.length + DIRECT_SOURCES.length + KUWAIT_YOUM_RSS_SOURCES.length} RSS feeds...`);
  const rssResults = await Promise.allSettled([
    ...GOOGLE_NEWS_SOURCES.map(s => fetchRSSSource(s)),
    ...DIRECT_SOURCES.map(s => fetchRSSSource(s)),
    ...KUWAIT_YOUM_RSS_SOURCES.map(s => fetchRSSSource(s)),
  ]);

  // 2. Scrape official tender sources
  console.error('\n[HTML] Scraping official tender portals...');
  const captArticles = await scrapeCAPT();

  // 3. Kuwait Al-Youm authenticated API (last 4 issues across all tender types)
  console.error('\n[KY] Kuwait Al-Youm authenticated tender fetch...');
  const kyAuth = await loginKuwaitYoum();
  const kuwaitYoumArticles = kyAuth ? await fetchKuwaitYoumTenders(kyAuth) : [];
  if (!kyAuth) console.error('  ! Kuwait Al-Youm: skipped (no credentials)');

  // 3. Merge everything — official sources take priority
  const allArticles = [];
  const seen = new Set();

  // Add official tender sources FIRST (highest priority)
  for (const art of [...captArticles, ...kuwaitYoumArticles]) {
    if (!art) continue;
    const key = art.title.slice(0, 60).trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      allArticles.push(art);
    }
  }

  // Then add RSS articles
  for (const r of rssResults) {
    if (r.status !== 'fulfilled') continue;
    for (const a of r.value) {
      const key = a.title.slice(0, 60).trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        allArticles.push(a);
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
  console.error(`\nDone: ${allArticles.length} total articles → ${OUTPUT_PATH}`);
  console.error(`  • Official tenders: ${[...captArticles, ...kuwaitYoumArticles].length}`);
  console.error(`  • RSS articles: ${allArticles.length - [...captArticles, ...kuwaitYoumArticles].length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
