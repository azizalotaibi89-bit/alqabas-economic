import axios from 'axios';

// Static JSON path served from gh-pages alongside the built site
const BASE_PATH = import.meta.env.BASE_URL || '/';
const NEWS_JSON_URL = `${BASE_PATH}news.json`;

// In-memory cache so we only fetch the big JSON once per session
let newsCache = null;
let newsCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getAllNews() {
  const now = Date.now();
  if (newsCache && now - newsCacheTime < CACHE_TTL) return newsCache;
  const { data } = await axios.get(NEWS_JSON_URL, { timeout: 15000 });
  newsCache = data.data || [];
  newsCacheTime = now;
  return newsCache;
}

export const fetchNews = async ({ category, limit = 200, page = 1 } = {}) => {
  let articles = await getAllNews();
  if (category && category !== 'all') {
    articles = articles.filter((a) => a.category === category);
  }
  const start = (page - 1) * limit;
  const paged = articles.slice(start, start + limit);
  return { success: true, total: articles.length, page, limit, data: paged };
};

export const fetchLatestNews = async () => {
  const articles = await getAllNews();
  return { success: true, data: articles.slice(0, 5) };
};

export const fetchNewsById = async (id) => {
  const articles = await getAllNews();
  const article = articles.find((a) => a.id === id);
  if (!article) throw new Error('Article not found');
  return { success: true, data: article };
};

export const fetchCategories = async () => {
  const articles = await getAllNews();
  const categories = [...new Set(articles.map((a) => a.category))];
  return { success: true, data: categories };
};

// Stocks — handled by TradingView widget directly
export const fetchStocks = async () => {
  return { success: true, data: [] };
};

// Tenders — filter مناقصات category from the news feed
export const fetchTenders = async ({ limit = 40 } = {}) => {
  const articles = await getAllNews();
  const tenders = articles
    .filter((a) => a.category === 'مناقصات')
    .slice(0, limit);
  return { success: true, data: tenders };
};

export default axios;
