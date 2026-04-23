const axios = require('axios');
const NodeCache = require('node-cache');

// Cache for 5 minutes (stocks update more frequently)
const cache = new NodeCache({ stdTTL: 300 });

const BOURSA_BASE = 'https://www.boursakuwait.com.kw/data-api/client-services';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  Referer: 'https://www.boursakuwait.com.kw/',
  Origin: 'https://www.boursakuwait.com.kw',
};

/**
 * Attempt to parse Boursa Kuwait API response into a normalized stock array.
 * The API returns data in various shapes — we handle all known formats.
 */
function parseBoursaResponse(data) {
  // If it's a string, try JSON.parse
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch (_) { return null; }
  }

  // Try to find the data array in the response
  let items = null;

  if (Array.isArray(data)) {
    items = data;
  } else if (data && typeof data === 'object') {
    // Common response shapes
    items =
      data.Data ||
      data.data ||
      data.Result ||
      data.result ||
      data.Items ||
      data.items ||
      null;
    if (items && !Array.isArray(items)) {
      // Might be nested: { UpMovers: [...], DownMovers: [...] }
      if (items.UpMovers || items.upMovers || items.Gainers || items.gainers) {
        return {
          gainers: normalizeStocks(items.UpMovers || items.upMovers || items.Gainers || items.gainers || []),
          losers: normalizeStocks(items.DownMovers || items.downMovers || items.Losers || items.losers || []),
        };
      }
      // Try to flatten object values
      const vals = Object.values(items);
      if (vals.length > 0 && Array.isArray(vals[0])) {
        items = vals.flat();
      } else {
        items = null;
      }
    }
  }

  if (!items || !Array.isArray(items) || items.length === 0) return null;

  const normalized = normalizeStocks(items);
  if (!normalized.length) return null;

  // Split into gainers (positive change) and losers (negative change)
  const gainers = normalized
    .filter((s) => s.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5);

  const losers = normalized
    .filter((s) => s.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5);

  return { gainers, losers };
}

/**
 * Normalize raw stock items into a consistent format.
 * Handles both Arabic-keyed and English-keyed responses, plus array rows.
 */
function normalizeStocks(items) {
  return items
    .map((item) => {
      // Array row format: [symbol, nameAr, lastPrice, change, changePct, volume, ...]
      if (Array.isArray(item)) {
        const changePct = parseFloat(item[4]) || 0;
        return {
          symbol: String(item[0] || ''),
          name: String(item[1] || item[0] || ''),
          lastPrice: parseFloat(item[2]) || 0,
          change: parseFloat(item[3]) || 0,
          changePercent: changePct,
          volume: parseInt(item[5]) || 0,
        };
      }

      // Object format — field names vary widely
      const symbol =
        item.CO_CODE || item.symbol || item.Symbol || item.SYMBOL ||
        item.CompanyCode || item.company_code || '';
      const name =
        item.CO_NAMEL || item.CO_NAME || item.NameAr || item.name_ar ||
        item.CompanyNameAr || item.CompanyName || item.name || item.Name || symbol;
      const lastPrice = parseFloat(
        item.CLOSE_PRICE || item.LAST_TRADE || item.LastTrade || item.last_price ||
        item.price || item.Price || item.close || 0
      );
      const change = parseFloat(
        item.CHANGE_VALUE || item.CHANGE || item.change || item.Change ||
        item.price_change || 0
      );
      const changePercent = parseFloat(
        item.CHANGE_PER || item.ChangePercent || item.change_percent ||
        item.ChangePercentage || item.pct_change || 0
      );
      const volume = parseInt(
        item.VOLUME || item.VOL || item.volume || item.Volume || 0
      );

      if (!symbol && !name) return null;

      return { symbol, name, lastPrice, change, changePercent, volume };
    })
    .filter(Boolean);
}

/**
 * Fetch top movers from Boursa Kuwait API
 */
async function fetchTopMovers() {
  // RT=3505: top movers, NR=10 gives up to 10 results total
  const url = `${BOURSA_BASE}?RT=3505&L=A&NR=10`;
  console.log(`📊 Fetching Boursa Kuwait top movers: ${url}`);

  const resp = await axios.get(url, {
    timeout: 10000,
    headers: HEADERS,
  });

  return parseBoursaResponse(resp.data);
}

/**
 * Fetch market summary (index level, volume, value)
 */
async function fetchMarketSummary() {
  const url = `${BOURSA_BASE}?RT=3508&L=A`;
  const resp = await axios.get(url, { timeout: 10000, headers: HEADERS });
  return resp.data;
}

/**
 * Main export: get stocks data (top 5 gainers + top 5 losers)
 */
async function getStocks() {
  const cacheKey = 'boursa_stocks';
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('✅ Serving cached stock data');
    return cached;
  }

  try {
    const result = await fetchTopMovers();
    if (result && (result.gainers?.length || result.losers?.length)) {
      console.log(`✅ Boursa: ${result.gainers.length} gainers, ${result.losers.length} losers`);
      cache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn(`⚠️ Boursa Kuwait API error: ${err.message}`);
  }

  // Fallback: return mock data
  console.warn('⚠️ Using mock stock data');
  return getMockStocks();
}

/**
 * Fallback mock stock data
 */
function getMockStocks() {
  return {
    gainers: [
      { symbol: 'NBK', name: 'بنك الكويت الوطني', lastPrice: 0.920, change: 0.020, changePercent: 2.22, volume: 3450000 },
      { symbol: 'ZAIN', name: 'زين الكويت', lastPrice: 0.450, change: 0.015, changePercent: 3.45, volume: 2100000 },
      { symbol: 'AGILITY', name: 'أجيليتي للخدمات اللوجستية', lastPrice: 0.680, change: 0.018, changePercent: 2.72, volume: 1230000 },
      { symbol: 'BKME', name: 'بنك الكويت والشرق الأوسط', lastPrice: 0.295, change: 0.010, changePercent: 3.51, volume: 870000 },
      { symbol: 'KFH', name: 'بيت التمويل الكويتي', lastPrice: 0.780, change: 0.012, changePercent: 1.56, volume: 1560000 },
    ],
    losers: [
      { symbol: 'ALAFCO', name: 'شركة الأفكو', lastPrice: 0.340, change: -0.015, changePercent: -4.23, volume: 560000 },
      { symbol: 'KIPCO', name: 'شركة المشاريع الكويتية', lastPrice: 0.212, change: -0.008, changePercent: -3.64, volume: 780000 },
      { symbol: 'KOC', name: 'شركة نفط الكويت', lastPrice: 0.520, change: -0.012, changePercent: -2.25, volume: 430000 },
      { symbol: 'WARBA', name: 'مصرف وربة', lastPrice: 0.185, change: -0.005, changePercent: -2.63, volume: 320000 },
      { symbol: 'GBK', name: 'البنك التجاري الكويتي', lastPrice: 0.430, change: -0.009, changePercent: -2.05, volume: 650000 },
    ],
    isMock: true,
    lastUpdated: new Date().toISOString(),
  };
}

module.exports = { getStocks };
