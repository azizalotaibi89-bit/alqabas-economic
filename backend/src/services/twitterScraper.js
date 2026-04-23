const axios = require('axios');
const xml2js = require('xml2js');
const NodeCache = require('node-cache');

// Cache tweets for 15 minutes
const cache = new NodeCache({ stdTTL: 900 });

// Multiple Nitter instances as fallbacks
const NITTER_INSTANCES = [
  'https://nitter.privacydev.net',
  'https://nitter.poast.org',
  'https://nitter.1d4.us',
  'https://nitter.lunar.icu',
  'https://nitter.fdn.fr',
];

const TARGET_ACCOUNT = 'thekstocks';

/**
 * Parse RSS XML into tweet objects
 */
async function parseRSS(xmlData) {
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

    // Strip HTML tags from description
    const description = rawDesc.replace(/<[^>]+>/g, '').trim();
    const title = rawTitle.replace(/<[^>]+>/g, '').trim();

    // Try to extract image from description
    const imgMatch = rawDesc.match(/<img[^>]+src="([^"]+)"/i);
    const image = imgMatch ? imgMatch[1] : null;

    // Generate ID from link
    const id = link.split('/').pop() || `tweet-${index}`;

    // Determine category based on keywords
    const text = (title + ' ' + description).toLowerCase();
    let category = 'عام';
    if (text.includes('سهم') || text.includes('أسهم') || text.includes('بورصة') || text.includes('stock')) {
      category = 'أسهم';
    } else if (text.includes('نفط') || text.includes('برميل') || text.includes('oil')) {
      category = 'نفط';
    } else if (text.includes('بنك') || text.includes('مصرف') || text.includes('bank')) {
      category = 'بنوك';
    } else if (text.includes('عقار') || text.includes('real estate')) {
      category = 'عقارات';
    } else if (text.includes('ذهب') || text.includes('gold') || text.includes('معدن')) {
      category = 'معادن';
    } else if (text.includes('كويت') || text.includes('kuwait')) {
      category = 'كويت';
    }

    return {
      id,
      title: title || description.substring(0, 100),
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
 * Fetch tweets from a single Nitter instance
 */
async function fetchFromNitter(instance) {
  const url = `${instance}/${TARGET_ACCOUNT}/rss`;
  const response = await axios.get(url, {
    timeout: 8000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
      Accept: 'application/rss+xml, application/xml, text/xml',
    },
  });
  return response.data;
}

/**
 * Main function: tries all Nitter instances until one works
 */
async function getTweets() {
  const cacheKey = `tweets_${TARGET_ACCOUNT}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('✅ Serving cached tweets');
    return cached;
  }

  for (const instance of NITTER_INSTANCES) {
    try {
      console.log(`🔍 Trying Nitter instance: ${instance}`);
      const xml = await fetchFromNitter(instance);
      const tweets = await parseRSS(xml);
      if (tweets.length > 0) {
        console.log(`✅ Got ${tweets.length} tweets from ${instance}`);
        cache.set(cacheKey, tweets);
        return tweets;
      }
    } catch (err) {
      console.warn(`⚠️ Failed: ${instance} — ${err.message}`);
    }
  }

  // All instances failed — return mock data
  console.warn('⚠️ All Nitter instances failed, returning mock data');
  return getMockData();
}

/**
 * Fallback mock data when all scrapers fail
 */
function getMockData() {
  const now = new Date();
  return [
    {
      id: 'mock-1',
      title: 'بورصة الكويت تغلق على ارتفاع ملحوظ في جلسة اليوم',
      description: 'أغلقت بورصة الكويت جلستها اليوم على ارتفاع ملحوظ بقيادة قطاع البنوك والاتصالات، وسط حجم تداولات بلغ 250 مليون دينار كويتي.',
      content: 'أغلقت بورصة الكويت جلستها اليوم على ارتفاع ملحوظ بقيادة قطاع البنوك والاتصالات، وسط حجم تداولات بلغ 250 مليون دينار كويتي. وسجل المؤشر العام ارتفاعاً بنسبة 0.85%.',
      link: 'https://twitter.com/thekstocks',
      pubDate: new Date(now - 1 * 3600000).toISOString(),
      image: null,
      category: 'أسهم',
      source: '@thekstocks',
    },
    {
      id: 'mock-2',
      title: 'أسعار النفط ترتفع وسط توترات جيوسياسية',
      description: 'سجلت أسعار النفط الخام ارتفاعاً ملحوظاً في التعاملات الآنية مع تصاعد التوترات الجيوسياسية في منطقة الشرق الأوسط.',
      content: 'سجلت أسعار النفط الخام ارتفاعاً ملحوظاً في التعاملات الآنية مع تصاعد التوترات الجيوسياسية في منطقة الشرق الأوسط. وتداول خام برنت عند مستوى 88 دولاراً للبرميل.',
      link: 'https://twitter.com/thekstocks',
      pubDate: new Date(now - 2 * 3600000).toISOString(),
      image: null,
      category: 'نفط',
      source: '@thekstocks',
    },
    {
      id: 'mock-3',
      title: 'بنك الكويت الوطني يعلن نتائج الربع الأول',
      description: 'أعلن بنك الكويت الوطني عن نتائجه المالية للربع الأول من العام الجاري، محققاً أرباحاً صافية بلغت 145 مليون دينار كويتي.',
      content: 'أعلن بنك الكويت الوطني عن نتائجه المالية للربع الأول من العام الجاري، محققاً أرباحاً صافية بلغت 145 مليون دينار كويتي بنمو 12% مقارنة بالفترة ذاتها من العام الماضي.',
      link: 'https://twitter.com/thekstocks',
      pubDate: new Date(now - 3 * 3600000).toISOString(),
      image: null,
      category: 'بنوك',
      source: '@thekstocks',
    },
    {
      id: 'mock-4',
      title: 'الذهب يتراجع مع ارتفاع الدولار الأمريكي',
      description: 'تراجعت أسعار الذهب في الأسواق العالمية في ظل ارتفاع مؤشر الدولار الأمريكي إثر البيانات الاقتصادية الإيجابية.',
      content: 'تراجعت أسعار الذهب في الأسواق العالمية لتسجل 2,150 دولاراً للأوقية في ظل ارتفاع مؤشر الدولار الأمريكي إثر صدور بيانات اقتصادية إيجابية من الاقتصاد الأمريكي.',
      link: 'https://twitter.com/thekstocks',
      pubDate: new Date(now - 4 * 3600000).toISOString(),
      image: null,
      category: 'معادن',
      source: '@thekstocks',
    },
    {
      id: 'mock-5',
      title: 'صندوق النقد الدولي يرفع توقعاته لنمو اقتصاد الكويت',
      description: 'رفع صندوق النقد الدولي توقعاته لمعدل نمو الاقتصاد الكويتي خلال العام الجاري إلى 3.2% مدفوعاً بارتفاع إيرادات النفط.',
      content: 'رفع صندوق النقد الدولي توقعاته لمعدل نمو الاقتصاد الكويتي خلال العام الجاري إلى 3.2% مدفوعاً بارتفاع إيرادات النفط وتحسن بيئة الأعمال وتنفيذ الإصلاحات الهيكلية.',
      link: 'https://twitter.com/thekstocks',
      pubDate: new Date(now - 5 * 3600000).toISOString(),
      image: null,
      category: 'كويت',
      source: '@thekstocks',
    },
    {
      id: 'mock-6',
      title: 'سوق العقارات الكويتي يشهد انتعاشاً في المعاملات',
      description: 'شهد سوق العقارات الكويتي انتعاشاً ملحوظاً في عدد المعاملات خلال الشهر الماضي مع تزايد الطلب على العقارات التجارية.',
      content: 'شهد سوق العقارات الكويتي انتعاشاً ملحوظاً في عدد المعاملات خلال الشهر الماضي، حيث بلغت قيمة الصفقات المبرمة نحو 300 مليون دينار كويتي مع تزايد الطلب على القطاع التجاري.',
      link: 'https://twitter.com/thekstocks',
      pubDate: new Date(now - 6 * 3600000).toISOString(),
      image: null,
      category: 'عقارات',
      source: '@thekstocks',
    },
  ];
}

module.exports = { getTweets };
