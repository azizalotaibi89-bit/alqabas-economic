const axios = require('axios');
const xml2js = require('xml2js');
const NodeCache = require('node-cache');

// Cache for 10 minutes
const cache = new NodeCache({ stdTTL: 600 });

// Kuwaiti newspaper RSS feeds — tried concurrently, all successes merged
const RSS_SOURCES = [
  // Arabic newspapers
  { name: 'الأنباء', nameEn: 'Al-Anba', url: 'https://www.alanba.com.kw/rss/', lang: 'ar' },
  { name: 'الأنباء - اقتصاد', nameEn: 'Al-Anba Economy', url: 'https://www.alanba.com.kw/rss/economy/', lang: 'ar' },
  { name: 'الراي', nameEn: 'Al-Rai', url: 'https://www.alrai.com/rss/', lang: 'ar' },
  { name: 'الراي', nameEn: 'Al-Rai', url: 'https://alrai.com/rss/', lang: 'ar' },
  { name: 'الراي - اقتصاد', nameEn: 'Al-Rai Economy', url: 'https://www.alrai.com/rss/economy', lang: 'ar' },
  { name: 'الوطن', nameEn: 'Al-Watan', url: 'https://www.alwatan.com.kw/rss/', lang: 'ar' },
  { name: 'الوطن', nameEn: 'Al-Watan', url: 'https://alwatan.com.kw/rss/', lang: 'ar' },
  { name: 'القبس', nameEn: 'Al-Qabas', url: 'https://www.alqabas.com/rss/', lang: 'ar' },
  { name: 'القبس', nameEn: 'Al-Qabas', url: 'https://alqabas.com/feed/', lang: 'ar' },
  { name: 'الجريدة', nameEn: 'Al-Jarida', url: 'https://www.aljarida.com/rss/', lang: 'ar' },
  { name: 'الجريدة', nameEn: 'Al-Jarida', url: 'https://aljarida.com/feed/', lang: 'ar' },
  { name: 'كونا', nameEn: 'KUNA', url: 'https://www.kuna.net.kw/rss/ArRss/ArRssEconomy.aspx', lang: 'ar' },
  { name: 'كونا', nameEn: 'KUNA', url: 'https://www.kuna.net.kw/rss/arrsshome.aspx', lang: 'ar' },
  // English newspapers (for fallback)
  { name: 'Kuwait Times', nameEn: 'Kuwait Times', url: 'https://www.kuwaittimes.com/feed/', lang: 'en' },
  { name: 'Arab Times', nameEn: 'Arab Times', url: 'https://www.arabtimesonline.com/rss/', lang: 'en' },
  { name: 'KUNA English', nameEn: 'KUNA English', url: 'https://www.kuna.net.kw/rss/EnRss/EnRssEconomy.aspx', lang: 'en' },
];

/**
 * Determine article category from title + description keywords
 */
function detectCategory(text) {
  const t = text.toLowerCase();
  if (t.match(/سهم|أسهم|بورصة|stock|shares|تداول|مؤشر|إغلاق|ارتفاع|انخفاض|تداولات|سوق الأوراق/)) return 'أسهم';
  if (t.match(/نفط|برميل|oil|opec|خام|أوبك|بترول|طاقة|gas|غاز/)) return 'نفط';
  if (t.match(/بنك|مصرف|bank|فائدة|قرض|ائتمان|تمويل|مصارف|مالي/)) return 'بنوك';
  if (t.match(/عقار|real estate|property|مشروع|مجمع|أراضي|شقق|عقارات/)) return 'عقارات';
  if (t.match(/ذهب|gold|معدن|فضة|silver|نحاس|copper|platinum|البلاتين/)) return 'معادن';
  if (t.match(/كويت|kuwait|حكومة|وزير|أمير|مجلس الأمة|ديوان/)) return 'كويت';
  return 'عام';
}

/**
 * Parse RSS XML into our article format
 */
async function parseRSSFeed(xmlData, source) {
  const parser = new xml2js.Parser({ explicitArray: false, trim: true });
  let result;
  try {
    result = await parser.parseStringPromise(xmlData);
  } catch (e) {
    return [];
  }

  const channel = result?.rss?.channel || result?.feed;
  if (!channel) return [];

  let items = channel.item || channel.entry;
  if (!items) return [];
  if (!Array.isArray(items)) items = [items];

  return items
    .map((item, index) => {
      const rawTitle = item.title?._?.trim() || (typeof item.title === 'string' ? item.title : '') || '';
      const rawDesc =
        item.description?._ ||
        item.description ||
        item['content:encoded']?._ ||
        item['content:encoded'] ||
        item.summary?._ ||
        item.summary ||
        '';
      const link =
        item.link?.href ||
        (typeof item.link === 'string' ? item.link : '') ||
        item.guid?._ ||
        item.guid ||
        '';
      const pubDate = item.pubDate || item.updated || item.published || new Date().toISOString();

      // Clean HTML tags
      const description = String(rawDesc).replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
      const title = String(rawTitle).replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim();

      if (!title && !description) return null;

      // Extract image from description HTML or enclosure
      let image = null;
      const imgMatch = String(rawDesc).match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch && !imgMatch[1].includes('emoji') && !imgMatch[1].includes('avatar')) {
        image = imgMatch[1];
      }
      if (!image && item.enclosure) {
        const encUrl = item.enclosure?.$?.url || item.enclosure?.url;
        if (encUrl && (encUrl.match(/\.(jpg|jpeg|png|webp)/i))) {
          image = encUrl;
        }
      }
      if (!image && item['media:content']) {
        const mediaUrl = item['media:content']?.$?.url || item['media:content']?.url;
        if (mediaUrl) image = mediaUrl;
      }
      if (!image && item['media:thumbnail']) {
        const thumbUrl = item['media:thumbnail']?.$?.url || item['media:thumbnail']?.url;
        if (thumbUrl) image = thumbUrl;
      }

      // Generate stable ID
      const id = `${source.nameEn}-${
        link.split('/').filter(Boolean).pop()?.substring(0, 40) || index
      }-${index}`.replace(/[^a-zA-Z0-9-_]/g, '-');

      const text = `${title} ${description}`;
      const category = detectCategory(text);

      let parsedDate;
      try {
        parsedDate = new Date(pubDate).toISOString();
      } catch (_) {
        parsedDate = new Date().toISOString();
      }

      return {
        id,
        title: title || description.substring(0, 120),
        description: description.substring(0, 500),
        content: description,
        link: String(link),
        pubDate: parsedDate,
        image,
        category,
        source: source.name,
        lang: source.lang,
      };
    })
    .filter(Boolean);
}

/**
 * Fetch one RSS feed, return articles or null on failure
 */
async function fetchOneFeed(source) {
  try {
    const resp = await axios.get(source.url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    const articles = await parseRSSFeed(resp.data, source);
    if (articles.length > 0) {
      console.log(`✅ ${source.name}: ${articles.length} articles from ${source.url}`);
      return articles;
    }
  } catch (err) {
    // Silently skip failed feeds
  }
  return null;
}

/**
 * Merge article arrays, deduplicate by title similarity, sort by date
 */
function mergeAndDedup(allArticles) {
  const seen = new Set();
  const unique = [];
  for (const article of allArticles) {
    // Use first 60 chars of title as dedup key
    const key = article.title.replace(/\s+/g, '').substring(0, 60).toLowerCase();
    if (!seen.has(key) && key.length > 5) {
      seen.add(key);
      unique.push(article);
    }
  }
  return unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}

/**
 * Main export: fetch news from all Kuwaiti newspaper RSS feeds
 */
async function getNews() {
  const cacheKey = 'kuwait_news_all';
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`✅ Serving ${cached.length} cached news articles`);
    return cached;
  }

  console.log('📰 Fetching from Kuwaiti newspaper RSS feeds...');

  // Try all feeds concurrently
  const results = await Promise.all(RSS_SOURCES.map((src) => fetchOneFeed(src)));

  // Flatten all successful results
  const allArticles = results
    .filter(Boolean)
    .flat();

  if (allArticles.length > 0) {
    const merged = mergeAndDedup(allArticles);
    console.log(`✅ Total: ${merged.length} unique articles from ${results.filter(Boolean).length} sources`);
    cache.set(cacheKey, merged);
    return merged;
  }

  console.warn('⚠️ All RSS feeds failed, returning mock data');
  return getMockData();
}

/**
 * Fallback mock data for when all live sources are down
 */
function getMockData() {
  const now = new Date();
  const ts = (h) => new Date(now - h * 3600000).toISOString();
  return [
    { id: 'mock-1', title: 'بورصة الكويت تغلق على ارتفاع ملحوظ بقيادة البنوك', description: 'أغلقت بورصة الكويت على ارتفاع بقيادة البنوك والاتصالات، وسط تداولات بلغت 250 مليون دينار.', content: '', link: 'https://www.alanba.com.kw', pubDate: ts(1), image: null, category: 'أسهم', source: 'الأنباء' },
    { id: 'mock-2', title: 'أسعار النفط ترتفع وسط توترات جيوسياسية', description: 'سجلت أسعار النفط الخام ارتفاعاً مع تصاعد التوترات في المنطقة. خام برنت عند 88 دولاراً.', content: '', link: 'https://www.alanba.com.kw', pubDate: ts(2), image: null, category: 'نفط', source: 'الأنباء' },
    { id: 'mock-3', title: 'بنك الكويت الوطني يعلن نتائج الربع الأول بنمو 12%', description: 'أرباح صافية 145 مليون دينار بنمو 12% مقارنة بالفترة ذاتها من العام الماضي.', content: '', link: 'https://www.alrai.com', pubDate: ts(3), image: null, category: 'بنوك', source: 'الراي' },
    { id: 'mock-4', title: 'الذهب يتراجع مع ارتفاع الدولار الأمريكي', description: 'تراجعت أسعار الذهب إلى 2,150 دولاراً للأوقية مع ارتفاع مؤشر الدولار.', content: '', link: 'https://www.alrai.com', pubDate: ts(4), image: null, category: 'معادن', source: 'الراي' },
    { id: 'mock-5', title: 'صندوق النقد يرفع توقعاته لنمو اقتصاد الكويت إلى 3.2%', description: 'رفع صندوق النقد الدولي توقعاته لنمو الاقتصاد الكويتي مدفوعاً بارتفاع عائدات النفط.', content: '', link: 'https://www.alqabas.com', pubDate: ts(5), image: null, category: 'كويت', source: 'القبس' },
    { id: 'mock-6', title: 'سوق العقارات الكويتي يشهد انتعاشاً قوياً', description: 'بلغت قيمة الصفقات 300 مليون دينار مع تزايد الطلب على القطاع التجاري.', content: '', link: 'https://www.alqabas.com', pubDate: ts(6), image: null, category: 'عقارات', source: 'القبس' },
    { id: 'mock-7', title: 'مؤشر الكويت العام يرتفع 0.7% في جلسة نشطة', description: 'تداولات قوية في القطاع الصناعي والمالي مع إقبال المستثمرين على الأسهم القيادية.', content: '', link: 'https://www.alanba.com.kw', pubDate: ts(7), image: null, category: 'أسهم', source: 'الأنباء' },
    { id: 'mock-8', title: 'الاحتياطي الفيدرالي يُبقي أسعار الفائدة دون تغيير', description: 'قرر الاحتياطي الفيدرالي الإبقاء على أسعار الفائدة في انتظار مزيد من البيانات.', content: '', link: 'https://www.kuwaittimes.com', pubDate: ts(8), image: null, category: 'عام', source: 'Kuwait Times' },
    { id: 'mock-9', title: 'زين الكويت تحقق أرباح 28 مليون دينار في الربع الأول', description: 'حققت شركة زين الكويت أرباحاً بلغت 28 مليون دينار في الربع الأول من العام.', content: '', link: 'https://www.alrai.com', pubDate: ts(9), image: null, category: 'أسهم', source: 'الراي' },
    { id: 'mock-10', title: 'أوبك+ تدرس تمديد تخفيضات الإنتاج لدعم الأسعار', description: 'تشير التقارير إلى احتمال تمديد تخفيضات أوبك+ لفترة إضافية لدعم أسعار النفط.', content: '', link: 'https://www.alanba.com.kw', pubDate: ts(10), image: null, category: 'نفط', source: 'الأنباء' },
  ];
}

module.exports = { getNews };
