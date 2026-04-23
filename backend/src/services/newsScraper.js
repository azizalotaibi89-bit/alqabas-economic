const axios = require('axios');
const xml2js = require('xml2js');
const NodeCache = require('node-cache');

// Cache: 8 min success, 1 min failure
const cache = new NodeCache({ stdTTL: 480 });

// Kuwaiti newspaper RSS feeds — all tried in parallel
const RSS_SOURCES = [
  // Al-Anba (الأنباء) — multiple category feeds
  { name: 'الأنباء', url: 'https://www.alanba.com.kw/rss/' },
  { name: 'الأنباء - اقتصاد', url: 'https://www.alanba.com.kw/rss/economy/' },
  { name: 'الأنباء - محليات', url: 'https://www.alanba.com.kw/rss/local/' },
  // Al-Rai (الراي)
  { name: 'الراي', url: 'https://www.alrai.com/rss/' },
  { name: 'الراي', url: 'https://alrai.com/rss/' },
  { name: 'الراي - اقتصاد', url: 'https://www.alrai.com/rss/economy' },
  // Al-Watan (الوطن)
  { name: 'الوطن', url: 'https://www.alwatan.com.kw/rss/' },
  { name: 'الوطن', url: 'https://alwatan.com.kw/rss/' },
  // Al-Qabas (القبس)
  { name: 'القبس', url: 'https://www.alqabas.com/rss/' },
  { name: 'القبس', url: 'https://alqabas.com/feed/' },
  { name: 'القبس - اقتصاد', url: 'https://www.alqabas.com/rss/economy/' },
  // Al-Jarida (الجريدة)
  { name: 'الجريدة', url: 'https://www.aljarida.com/rss/' },
  { name: 'الجريدة', url: 'https://aljarida.com/feed/' },
  // KUNA (كونا)
  { name: 'كونا', url: 'https://www.kuna.net.kw/rss/ArRss/ArRssEconomy.aspx' },
  { name: 'كونا', url: 'https://www.kuna.net.kw/rss/arrsshome.aspx' },
  { name: 'كونا - عربي', url: 'https://www.kuna.net.kw/rss/ArRss/ArRssLocal.aspx' },
  // English Kuwait papers
  { name: 'Kuwait Times', url: 'https://www.kuwaittimes.com/feed/' },
  { name: 'Kuwait Times', url: 'https://www.kuwaittimes.com/feed/business/' },
  { name: 'Arab Times', url: 'https://www.arabtimesonline.com/rss/' },
  { name: 'KUNA English', url: 'https://www.kuna.net.kw/rss/EnRss/EnRssEconomy.aspx' },
];

function detectCategory(text) {
  const t = (text || '').toLowerCase();
  if (t.match(/سهم|أسهم|بورصة|stock|shares|تداول|مؤشر|إغلاق|ارتفاع|انخفاض|تداولات|سوق الأوراق|ipo/)) return 'أسهم';
  if (t.match(/نفط|برميل|oil|opec|خام|أوبك|بترول|طاقة|gas|غاز|lng/)) return 'نفط';
  if (t.match(/بنك|مصرف|bank|فائدة|قرض|ائتمان|تمويل|مصارف|مالي|central bank/)) return 'بنوك';
  if (t.match(/عقار|real estate|property|مشروع|مجمع|أراضي|شقق|عقارات/)) return 'عقارات';
  if (t.match(/ذهب|gold|معدن|فضة|silver|نحاس|copper|platinum|البلاتين/)) return 'معادن';
  if (t.match(/كويت|kuwait|حكومة|وزير|أمير|مجلس الأمة|ديوان|amiri/)) return 'كويت';
  return 'عام';
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

  return items.map((item, idx) => {
    // Title
    const rawTitle = item.title?._ ?? (typeof item.title === 'string' ? item.title : '') ?? '';
    // Description / content
    const rawDesc =
      item['content:encoded']?._ ?? item['content:encoded'] ??
      item.description?._ ?? item.description ??
      item.summary?._ ?? item.summary ?? '';
    // Link
    const link =
      item.link?.href ??
      (typeof item.link === 'string' ? item.link : '') ??
      item.guid?._ ?? item.guid ?? '';
    // Date
    const pubDate = item.pubDate ?? item.updated ?? item.published ?? new Date().toISOString();

    const clean = (s) => String(s || '')
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ').replace(/\s+/g, ' ').trim();

    const title = clean(rawTitle);
    const description = clean(rawDesc).substring(0, 600);
    if (!title && !description) return null;

    // Image extraction
    let image = null;
    const descStr = String(rawDesc);
    const imgMatch = descStr.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1] && !imgMatch[1].includes('emoji') && !imgMatch[1].includes('avatar')) image = imgMatch[1];
    if (!image && item.enclosure) {
      const eu = item.enclosure?.$?.url ?? item.enclosure?.url;
      if (eu && /\.(jpg|jpeg|png|webp)/i.test(eu)) image = eu;
    }
    if (!image && item['media:content']) {
      const mu = item['media:content']?.$?.url ?? item['media:content']?.url;
      if (mu) image = mu;
    }
    if (!image && item['media:thumbnail']) {
      const tu = item['media:thumbnail']?.$?.url ?? item['media:thumbnail']?.url;
      if (tu) image = tu;
    }

    const slug = String(link).split('/').filter(Boolean).pop()?.substring(0, 40) || String(idx);
    const id = `${sourceName.replace(/\s+/g, '-')}-${slug}-${idx}`.replace(/[^a-zA-Z0-9\u0600-\u06FF-_]/g, '-');

    let parsedDate;
    try { parsedDate = new Date(pubDate).toISOString(); } catch { parsedDate = new Date().toISOString(); }

    return {
      id,
      title: title || description.substring(0, 120),
      description: description.substring(0, 500),
      content: description,
      link: String(link),
      pubDate: parsedDate,
      image,
      category: detectCategory(title + ' ' + description),
      source: sourceName,
    };
  }).filter(Boolean);
}

async function fetchOneFeed({ name, url }) {
  try {
    const resp = await axios.get(url, {
      timeout: 7000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      maxContentLength: 2 * 1024 * 1024, // 2MB max
    });
    const articles = await parseRSSFeed(resp.data, name);
    if (articles.length > 0) {
      console.log(`✅ ${name}: ${articles.length} articles`);
      return articles;
    }
  } catch (_) { /* silent */ }
  return [];
}

function deduplicate(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    // Use first 50 chars of title, normalised, as the dedup key
    const key = (a.title || '').replace(/\s+/g, '').substring(0, 50).toLowerCase();
    if (!key || key.length < 8) return true; // keep very short-title items
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Pre-warm: kick off a background fetch right on module load ───────────────
let warmupStarted = false;
function warmupCache() {
  if (warmupStarted) return;
  warmupStarted = true;
  setTimeout(() => getNews().catch(() => {}), 500);
}

async function getNews() {
  const cacheKey = 'kuwait_news_all';
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`✅ Cache hit: ${cached.length} articles`);
    return cached;
  }

  console.log('📰 Fetching from all Kuwaiti RSS feeds (parallel)...');

  // All feeds fire simultaneously; we don't wait for slowest ones.
  // Use allSettled so failures don't abort the batch.
  const OVERALL_TIMEOUT = 12000; // 12 s hard limit
  const allPromises = RSS_SOURCES.map((src) =>
    Promise.race([
      fetchOneFeed(src),
      new Promise((res) => setTimeout(() => res([]), OVERALL_TIMEOUT)),
    ])
  );

  const results = await Promise.allSettled(allPromises);

  const allArticles = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  const merged = deduplicate(allArticles)
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  if (merged.length > 0) {
    console.log(`✅ Total: ${merged.length} unique articles`);
    cache.set(cacheKey, merged);
    return merged;
  }

  console.warn('⚠️ All RSS feeds failed — returning mock data');
  return getMockData();
}

function getMockData() {
  const now = new Date();
  const ts = (h) => new Date(now - h * 3600000).toISOString();
  return [
    { id: 'mock-1', title: 'بورصة الكويت تغلق على ارتفاع ملحوظ بقيادة البنوك', description: 'أغلقت بورصة الكويت على ارتفاع بقيادة البنوك والاتصالات، وسط تداولات بلغت 250 مليون دينار.', content: '', link: 'https://www.alanba.com.kw', pubDate: ts(1), image: null, category: 'أسهم', source: 'الأنباء' },
    { id: 'mock-2', title: 'أسعار النفط ترتفع وسط توترات جيوسياسية', description: 'سجلت أسعار النفط الخام ارتفاعاً مع تصاعد التوترات في المنطقة. خام برنت عند 88 دولاراً.', content: '', link: 'https://www.alanba.com.kw', pubDate: ts(2), image: null, category: 'نفط', source: 'الأنباء' },
    { id: 'mock-3', title: 'بنك الكويت الوطني يعلن نتائج الربع الأول بنمو 12%', description: 'أرباح صافية 145 مليون دينار بنمو 12% مقارنة بالفترة ذاتها.', content: '', link: 'https://www.alrai.com', pubDate: ts(3), image: null, category: 'بنوك', source: 'الراي' },
    { id: 'mock-4', title: 'الذهب يتراجع مع ارتفاع الدولار الأمريكي', description: 'تراجعت أسعار الذهب إلى 2,150 دولاراً للأوقية مع ارتفاع مؤشر الدولار.', content: '', link: 'https://www.alrai.com', pubDate: ts(4), image: null, category: 'معادن', source: 'الراي' },
    { id: 'mock-5', title: 'صندوق النقد يرفع توقعاته لنمو اقتصاد الكويت', description: 'رفع صندوق النقد الدولي توقعاته لنمو الاقتصاد الكويتي مدفوعاً بارتفاع عائدات النفط.', content: '', link: 'https://www.alqabas.com', pubDate: ts(5), image: null, category: 'كويت', source: 'القبس' },
    { id: 'mock-6', title: 'سوق العقارات الكويتي يشهد انتعاشاً قوياً', description: 'بلغت قيمة الصفقات 300 مليون دينار مع تزايد الطلب على القطاع التجاري.', content: '', link: 'https://www.alqabas.com', pubDate: ts(6), image: null, category: 'عقارات', source: 'القبس' },
    { id: 'mock-7', title: 'مؤشر الكويت العام يرتفع 0.7% في جلسة نشطة', description: 'تداولات قوية في القطاع الصناعي والمالي مع إقبال المستثمرين على الأسهم القيادية.', content: '', link: 'https://www.alanba.com.kw', pubDate: ts(7), image: null, category: 'أسهم', source: 'الأنباء' },
    { id: 'mock-8', title: 'الاحتياطي الفيدرالي يُبقي أسعار الفائدة دون تغيير', description: 'قرر الاحتياطي الفيدرالي الإبقاء على أسعار الفائدة في انتظار مزيد من البيانات.', content: '', link: 'https://www.kuwaittimes.com', pubDate: ts(8), image: null, category: 'عام', source: 'Kuwait Times' },
    { id: 'mock-9', title: 'زين الكويت تحقق أرباح 28 مليون دينار', description: 'حققت شركة زين الكويت أرباحاً بلغت 28 مليون دينار في الربع الأول من العام.', content: '', link: 'https://www.alrai.com', pubDate: ts(9), image: null, category: 'أسهم', source: 'الراي' },
    { id: 'mock-10', title: 'أوبك+ تدرس تمديد تخفيضات الإنتاج', description: 'تشير التقارير إلى احتمال تمديد تخفيضات أوبك+ لفترة إضافية لدعم أسعار النفط.', content: '', link: 'https://www.alanba.com.kw', pubDate: ts(10), image: null, category: 'نفط', source: 'الأنباء' },
    { id: 'mock-11', title: 'الكويت تطلق مشروع البنية التحتية الرقمية', description: 'أعلنت وزارة الاتصالات عن مشروع ضخم لتطوير البنية التحتية الرقمية بتكلفة 500 مليون دينار.', content: '', link: 'https://www.alanba.com.kw', pubDate: ts(11), image: null, category: 'كويت', source: 'الأنباء' },
    { id: 'mock-12', title: 'بورصة الكويت: تداولات الأسبوع تتجاوز مليار دينار', description: 'سجلت البورصة تداولات قياسية خلال الأسبوع الماضي بقيادة الأسهم المصرفية والنفطية.', content: '', link: 'https://www.alqabas.com', pubDate: ts(12), image: null, category: 'أسهم', source: 'القبس' },
  ];
}

// Kick off warmup immediately so first user request is faster
warmupCache();

module.exports = { getNews };
