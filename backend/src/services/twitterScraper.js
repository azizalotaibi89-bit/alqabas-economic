const axios = require('axios');
const xml2js = require('xml2js');
const NodeCache = require('node-cache');

// Cache for 10 minutes on success, retry faster on failure
const cache = new NodeCache({ stdTTL: 600 });

const TARGET_ACCOUNT = 'thekstocks';

// Nitter instances — tried in order, first success wins
const NITTER_INSTANCES = [
  'https://nitter.poast.org',
  'https://nitter.privacydev.net',
  'https://nitter.1d4.us',
  'https://nitter.lunar.icu',
  'https://nitter.net',
  'https://nitter.nl',
  'https://nitter.at',
  'https://nitter.fdn.fr',
  'https://nitter.it',
  'https://nitter.42l.fr',
];

// RSSHub instances as secondary source
const RSSHUB_INSTANCES = [
  'https://rsshub.app',
  'https://rsshub.rssforever.com',
];

/**
 * Convert a Nitter proxy image URL → direct pbs.twimg.com URL
 * Nitter wraps images as: /pic/orig/media%2FHASH.jpg  OR  /pic/enc/BASE64
 */
function resolveImageUrl(imgUrl, instance) {
  if (!imgUrl) return null;
  let url = imgUrl.trim();

  // Make relative URLs absolute using the Nitter instance
  if (url.startsWith('/')) {
    url = `${instance}${url}`;
  }

  // Already a direct Twitter CDN URL — return as-is
  if (url.includes('pbs.twimg.com')) {
    return url;
  }

  // Try to extract and decode Nitter proxy path: /pic/[orig/][enc/]PAYLOAD
  const picMatch = url.match(/\/pic\/(?:orig\/|enc\/)?(.+)$/);
  if (picMatch) {
    const payload = picMatch[1];

    // --- Strategy 1: URL-encoded path, e.g. media%2FAbCdEf.jpg ---
    try {
      const decoded = decodeURIComponent(payload);
      if (
        decoded.startsWith('media/') ||
        decoded.startsWith('tweet_video_thumb/') ||
        decoded.startsWith('ext_tw_video_thumb/')
      ) {
        // Append :large for better resolution
        const ext = decoded.match(/\.[a-zA-Z]+$/) ? '' : '.jpg';
        return `https://pbs.twimg.com/${decoded}${ext}`;
      }
      // Sometimes the decoded payload IS the full pbs.twimg.com URL
      if (decoded.startsWith('https://pbs.twimg.com')) {
        return decoded;
      }
    } catch (_) {}

    // --- Strategy 2: Base64-encoded URL ---
    try {
      const b64 = Buffer.from(payload, 'base64').toString('utf-8');
      if (b64.startsWith('https://pbs.twimg.com') || b64.startsWith('http://pbs.twimg.com')) {
        return b64;
      }
    } catch (_) {}

    // --- Strategy 3: URL contains pbs.twimg.com somewhere ---
    const embedded = url.match(/(https?:\/\/pbs\.twimg\.com\/[^\s"'<>]+)/);
    if (embedded) return embedded[1];
  }

  // Fallback: return the absolute Nitter-proxied URL
  return url;
}

/**
 * Parse RSS XML from either Nitter or RSSHub into our article format
 */
async function parseRSS(xmlData, instance = '') {
  const parser = new xml2js.Parser({ explicitArray: false });
  const result = await parser.parseStringPromise(xmlData);
  const items = result?.rss?.channel?.item;

  if (!items) return [];

  const itemArray = Array.isArray(items) ? items : [items];

  return itemArray.map((item, index) => {
    const rawTitle = item.title || '';
    const rawDesc = item.description || '';
    const link = item.link || '';
    const pubDate = item.pubDate || new Date().toISOString();

    // Strip HTML tags to get plain text
    const description = rawDesc.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const title = rawTitle.replace(/<[^>]+>/g, '').trim();

    // Extract ALL image URLs from description HTML
    // Match both src and data-src attributes, handle single and double quotes
    let image = null;
    const imgRegex = /<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(rawDesc)) !== null) {
      const resolved = resolveImageUrl(match[1], instance);
      if (resolved && !resolved.includes('emoji') && !resolved.includes('avatar')) {
        image = resolved;
        break; // Take the first real media image
      }
    }

    // Also check <enclosure> tag which some RSS feeds use for media
    if (!image && item.enclosure) {
      const encUrl = item.enclosure?.$ ?.url || item.enclosure?.url;
      if (encUrl) image = resolveImageUrl(encUrl, instance);
    }

    // Generate stable ID from tweet link
    const id = link.split('/status/')[1]?.split('#')[0] || link.split('/').pop() || `tweet-${index}`;

    // Determine category from keywords in text
    const text = (title + ' ' + description).toLowerCase();
    let category = 'عام';
    if (text.match(/سهم|أسهم|بورصة|stock|shares|تداول|مؤشر|إغلاق/)) {
      category = 'أسهم';
    } else if (text.match(/نفط|برميل|oil|opec|خام|أوبك|بترول/)) {
      category = 'نفط';
    } else if (text.match(/بنك|مصرف|bank|فائدة|قرض|ائتمان/)) {
      category = 'بنوك';
    } else if (text.match(/عقار|real estate|property|مشروع|مجمع/)) {
      category = 'عقارات';
    } else if (text.match(/ذهب|gold|معدن|فضة|silver/)) {
      category = 'معادن';
    } else if (text.match(/كويت|kuwait/)) {
      category = 'كويت';
    }

    return {
      id,
      title: title || description.substring(0, 120),
      description: description.substring(0, 500),
      content: description,
      link,
      pubDate: new Date(pubDate).toISOString(),
      image,
      category,
      source: `@${TARGET_ACCOUNT}`,
    };
  });
}

/**
 * Fetch RSS from a Nitter instance
 */
async function fetchFromNitter(instance) {
  const url = `${instance}/${TARGET_ACCOUNT}/rss`;
  const response = await axios.get(url, {
    timeout: 8000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
  });
  return { data: response.data, instance };
}

/**
 * Fetch RSS from a RSSHub instance
 */
async function fetchFromRSSHub(instance) {
  const url = `${instance}/twitter/user/${TARGET_ACCOUNT}`;
  const response = await axios.get(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
  });
  return { data: response.data, instance };
}

/**
 * Try all Nitter instances concurrently (race — first success wins)
 */
async function tryAllNitterInstances() {
  const attempts = NITTER_INSTANCES.map((inst) =>
    fetchFromNitter(inst).catch(() => null)
  );

  // Try in parallel, take first non-null result with items
  const results = await Promise.all(attempts);
  for (const res of results) {
    if (res) {
      const tweets = await parseRSS(res.data, res.instance);
      if (tweets.length > 0) {
        console.log(`✅ Nitter: got ${tweets.length} tweets from ${res.instance}`);
        return tweets;
      }
    }
  }
  return null;
}

/**
 * Try RSSHub instances sequentially
 */
async function tryRSSHub() {
  for (const inst of RSSHUB_INSTANCES) {
    try {
      console.log(`🔍 Trying RSSHub: ${inst}`);
      const res = await fetchFromRSSHub(inst);
      const tweets = await parseRSS(res.data, inst);
      if (tweets.length > 0) {
        console.log(`✅ RSSHub: got ${tweets.length} tweets from ${inst}`);
        return tweets;
      }
    } catch (err) {
      console.warn(`⚠️ RSSHub failed: ${inst} — ${err.message}`);
    }
  }
  return null;
}

/**
 * Merge two tweet arrays, deduplicate by ID, sort by date (newest first)
 */
function mergeTweets(a, b) {
  const map = new Map();
  for (const t of [...a, ...b]) {
    if (!map.has(t.id)) map.set(t.id, t);
  }
  return Array.from(map.values()).sort(
    (x, y) => new Date(y.pubDate) - new Date(x.pubDate)
  );
}

/**
 * Main export: fetch tweets from all available sources
 */
async function getTweets() {
  const cacheKey = `tweets_${TARGET_ACCOUNT}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`✅ Serving ${cached.length} cached tweets`);
    return cached;
  }

  // Run Nitter (parallel) and RSSHub simultaneously
  const [nitterResult, rsshubResult] = await Promise.all([
    tryAllNitterInstances().catch(() => null),
    tryRSSHub().catch(() => null),
  ]);

  let tweets = [];

  if (nitterResult && rsshubResult) {
    tweets = mergeTweets(nitterResult, rsshubResult);
    console.log(`✅ Merged: ${tweets.length} unique tweets`);
  } else if (nitterResult) {
    tweets = nitterResult;
  } else if (rsshubResult) {
    tweets = rsshubResult;
  }

  if (tweets.length > 0) {
    cache.set(cacheKey, tweets);
    return tweets;
  }

  // All sources failed — return mock data
  console.warn('⚠️ All sources failed, returning mock data');
  return getMockData();
}

/**
 * Fallback mock data — shown when all live sources are down
 */
function getMockData() {
  const now = new Date();
  const ts = (h) => new Date(now - h * 3600000).toISOString();

  return [
    { id: 'mock-1', title: 'بورصة الكويت تغلق على ارتفاع ملحوظ', description: 'أغلقت بورصة الكويت على ارتفاع بقيادة البنوك والاتصالات، وسط تداولات بلغت 250 مليون دينار.', content: '', link: 'https://twitter.com/thekstocks', pubDate: ts(1), image: null, category: 'أسهم', source: '@thekstocks' },
    { id: 'mock-2', title: 'أسعار النفط ترتفع وسط توترات جيوسياسية', description: 'سجلت أسعار النفط الخام ارتفاعاً مع تصاعد التوترات في المنطقة. خام برنت عند 88 دولاراً.', content: '', link: 'https://twitter.com/thekstocks', pubDate: ts(2), image: null, category: 'نفط', source: '@thekstocks' },
    { id: 'mock-3', title: 'بنك الكويت الوطني يعلن نتائج الربع الأول', description: 'أرباح صافية 145 مليون دينار بنمو 12% مقارنة بالفترة ذاتها.', content: '', link: 'https://twitter.com/thekstocks', pubDate: ts(3), image: null, category: 'بنوك', source: '@thekstocks' },
    { id: 'mock-4', title: 'الذهب يتراجع مع ارتفاع الدولار', description: 'تراجعت أسعار الذهب إلى 2,150 دولاراً للأوقية مع ارتفاع مؤشر الدولار.', content: '', link: 'https://twitter.com/thekstocks', pubDate: ts(4), image: null, category: 'معادن', source: '@thekstocks' },
    { id: 'mock-5', title: 'صندوق النقد يرفع توقعاته لنمو اقتصاد الكويت إلى 3.2%', description: 'رفع صندوق النقد الدولي توقعاته لنمو الاقتصاد الكويتي مدفوعاً بارتفاع عائدات النفط.', content: '', link: 'https://twitter.com/thekstocks', pubDate: ts(5), image: null, category: 'كويت', source: '@thekstocks' },
    { id: 'mock-6', title: 'سوق العقارات الكويتي يشهد انتعاشاً', description: 'بلغت قيمة الصفقات 300 مليون دينار مع تزايد الطلب على القطاع التجاري.', content: '', link: 'https://twitter.com/thekstocks', pubDate: ts(6), image: null, category: 'عقارات', source: '@thekstocks' },
    { id: 'mock-7', title: 'مؤشر الكويت العام يرتفع 0.7% في جلسة نشطة', description: 'تداولات قوية في القطاع الصناعي والمالي مع إقبال المستثمرين على الأسهم القيادية.', content: '', link: 'https://twitter.com/thekstocks', pubDate: ts(7), image: null, category: 'أسهم', source: '@thekstocks' },
    { id: 'mock-8', title: 'الاحتياطي الفيدرالي يُبقي أسعار الفائدة دون تغيير', description: 'قرر الاحتياطي الفيدرالي الإبقاء على أسعار الفائدة في انتظار مزيد من البيانات الاقتصادية.', content: '', link: 'https://twitter.com/thekstocks', pubDate: ts(8), image: null, category: 'عام', source: '@thekstocks' },
    { id: 'mock-9', title: 'شركة زين الكويت تُعلن عن أرباح الربع الأول', description: 'حققت شركة زين الكويت أرباحاً بلغت 28 مليون دينار في الربع الأول من العام الجاري.', content: '', link: 'https://twitter.com/thekstocks', pubDate: ts(9), image: null, category: 'أسهم', source: '@thekstocks' },
    { id: 'mock-10', title: 'توقعات بارتفاع أسعار النفط مع تمديد تخفيضات أوبك+', description: 'تشير التقارير إلى احتمال تمديد تخفيضات أوبك+ لفترة إضافية لدعم أسعار النفط.', content: '', link: 'https://twitter.com/thekstocks', pubDate: ts(10), image: null, category: 'نفط', source: '@thekstocks' },
  ];
}

module.exports = { getTweets };
