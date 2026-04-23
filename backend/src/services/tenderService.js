const axios = require('axios');
const NodeCache = require('node-cache');

// Cache for 60 minutes (tenders don't change often)
const cache = new NodeCache({ stdTTL: 3600 });

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ar,en;q=0.9',
};

/**
 * Scrape CAPT (Central Agency for Public Tenders) open tenders page.
 * CAPT is the authoritative source for Kuwait government tenders — same data
 * that appears in the Kuwait Al-Youm official gazette.
 */
async function scrapeCAPT() {
  const url = 'https://capt.gov.kw/en/tenders/opening-tenders/';
  console.log(`📋 Fetching CAPT tenders: ${url}`);

  const resp = await axios.get(url, {
    timeout: 15000,
    headers: HEADERS,
  });

  const html = resp.data;
  const tenders = [];

  // CAPT renders a table with tender details. We parse it with regex since
  // cheerio isn't in the dependencies. Adjust selectors based on actual HTML structure.

  // Strategy 1: Extract table rows from the tender listing table
  // Common pattern: rows with tender number, ministry, subject, date, closing date
  const tableRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const htmlTagRegex = /<[^>]+>/g;

  let rowMatch;
  let rowCount = 0;

  while ((rowMatch = tableRowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      const cellText = cellMatch[1]
        .replace(htmlTagRegex, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#\d+;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (cellText) cells.push(cellText);
    }

    // We expect rows with at least 4 cells: [No, Ministry, Subject, Date, Closing Date]
    if (cells.length >= 4) {
      // Skip header rows
      if (cells[0].match(/^(no|#|رقم|tender)/i)) continue;
      if (rowCount === 0 && cells.every((c) => c.length < 30)) { rowCount++; continue; }

      const tender = {
        id: `capt-${rowCount + 1}`,
        tenderNo: cells[0] || '',
        organization: cells[1] || '',
        subject: cells[2] || cells[1] || '',
        requestDate: cells[3] || '',
        deadline: cells[4] || cells[3] || '',
        type: cells[5] || 'مناقصة عامة',
        source: 'CAPT',
        link: url,
      };

      if (tender.subject && tender.subject.length > 5) {
        tenders.push(tender);
        rowCount++;
      }
    }
  }

  // Strategy 2: Look for structured JSON data embedded in the page
  if (tenders.length === 0) {
    const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/);
    if (jsonMatch) {
      try {
        const state = JSON.parse(jsonMatch[1]);
        const items = state?.tenders?.data || state?.data || [];
        if (Array.isArray(items)) {
          items.forEach((item, i) => {
            tenders.push({
              id: `capt-json-${i}`,
              tenderNo: item.tender_no || item.TenderNo || String(i + 1),
              organization: item.ministry || item.Ministry || item.organization || '',
              subject: item.subject || item.Subject || item.title || item.Title || '',
              requestDate: item.request_date || item.RequestDate || '',
              deadline: item.last_date || item.LastDate || item.deadline || item.Deadline || '',
              type: item.type || item.Type || 'مناقصة',
              source: 'CAPT',
              link: url,
            });
          });
        }
      } catch (_) {}
    }
  }

  return tenders;
}

/**
 * Try alternative Kuwait tenders sources if CAPT fails
 */
async function scrapeAlternativeSources() {
  // Try the Kuwait e-Government portal tender listing
  const urls = [
    'https://capt.gov.kw/ar/tenders/opening-tenders/',
    'https://capt.gov.kw/en/tenders/opening-tenders/?page=1',
  ];

  for (const url of urls) {
    try {
      const resp = await axios.get(url, { timeout: 15000, headers: HEADERS });
      const html = resp.data;

      // Quick check: does the page have tender data?
      if (html.includes('tender') || html.includes('مناقصة')) {
        const tenders = parseTendersFromHTML(html, url);
        if (tenders.length > 0) return tenders;
      }
    } catch (_) {}
  }
  return [];
}

/**
 * Generic HTML tender extractor
 */
function parseTendersFromHTML(html, sourceUrl) {
  const tenders = [];
  const seen = new Set();

  // Look for any anchor tags that might link to tender detail pages
  const linkRegex = /<a[^>]+href="([^"]*(?:tender|مناقصة)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch;
  let index = 0;

  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1];
    const linkText = linkMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

    if (linkText.length > 10 && !seen.has(linkText.substring(0, 40))) {
      seen.add(linkText.substring(0, 40));
      tenders.push({
        id: `tender-link-${index++}`,
        tenderNo: String(index),
        organization: '',
        subject: linkText,
        requestDate: '',
        deadline: '',
        type: 'مناقصة',
        source: 'CAPT',
        link: href.startsWith('http') ? href : `https://capt.gov.kw${href}`,
      });
    }
    if (tenders.length >= 20) break;
  }

  return tenders;
}

/**
 * Main export: get latest tenders from Kuwait Al-Youm / CAPT
 */
async function getTenders() {
  const cacheKey = 'kuwait_tenders';
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`✅ Serving ${cached.length} cached tenders`);
    return cached;
  }

  try {
    let tenders = await scrapeCAPT();

    if (tenders.length === 0) {
      console.warn('⚠️ CAPT main page returned no tenders, trying alternatives...');
      tenders = await scrapeAlternativeSources();
    }

    if (tenders.length > 0) {
      console.log(`✅ Found ${tenders.length} tenders`);
      cache.set(cacheKey, tenders);
      return tenders;
    }
  } catch (err) {
    console.warn(`⚠️ Tender scraping error: ${err.message}`);
  }

  console.warn('⚠️ Using mock tender data');
  return getMockTenders();
}

/**
 * Fallback mock tender data based on typical Kuwait government tender format
 */
function getMockTenders() {
  const today = new Date();
  const deadline = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('ar-KW', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return [
    {
      id: 'mock-t1', tenderNo: '2024/01',
      organization: 'وزارة الأشغال العامة',
      subject: 'صيانة وإصلاح الطرق في محافظة العاصمة',
      requestDate: today.toLocaleDateString('ar-KW'),
      deadline: deadline(14),
      type: 'مناقصة عامة',
      source: 'CAPT', link: 'https://capt.gov.kw/en/tenders/opening-tenders/',
    },
    {
      id: 'mock-t2', tenderNo: '2024/02',
      organization: 'وزارة الصحة',
      subject: 'توريد أجهزة طبية ومستلزمات مستشفى الأميري',
      requestDate: today.toLocaleDateString('ar-KW'),
      deadline: deadline(21),
      type: 'مناقصة عامة',
      source: 'CAPT', link: 'https://capt.gov.kw/en/tenders/opening-tenders/',
    },
    {
      id: 'mock-t3', tenderNo: '2024/03',
      organization: 'وزارة التربية',
      subject: 'إنشاء مدرسة ابتدائية في منطقة الصليبيخات',
      requestDate: today.toLocaleDateString('ar-KW'),
      deadline: deadline(30),
      type: 'مناقصة عامة',
      source: 'CAPT', link: 'https://capt.gov.kw/en/tenders/opening-tenders/',
    },
    {
      id: 'mock-t4', tenderNo: '2024/04',
      organization: 'البلدية',
      subject: 'توريد وتركيب أنظمة إضاءة ذكية لشوارع مدينة الكويت',
      requestDate: today.toLocaleDateString('ar-KW'),
      deadline: deadline(18),
      type: 'ممارسة',
      source: 'CAPT', link: 'https://capt.gov.kw/en/tenders/opening-tenders/',
    },
    {
      id: 'mock-t5', tenderNo: '2024/05',
      organization: 'وزارة الداخلية',
      subject: 'توريد سيارات دورية للإدارة العامة للمرور',
      requestDate: today.toLocaleDateString('ar-KW'),
      deadline: deadline(25),
      type: 'مناقصة عامة',
      source: 'CAPT', link: 'https://capt.gov.kw/en/tenders/opening-tenders/',
    },
    {
      id: 'mock-t6', tenderNo: '2024/06',
      organization: 'مؤسسة البترول الكويتية',
      subject: 'خدمات الصيانة الدورية لمنشآت التكرير',
      requestDate: today.toLocaleDateString('ar-KW'),
      deadline: deadline(45),
      type: 'مناقصة دولية',
      source: 'CAPT', link: 'https://capt.gov.kw/en/tenders/opening-tenders/',
    },
  ];
}

module.exports = { getTenders };
