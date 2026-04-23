import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 25000, // backend fetches from multiple sources; give it time
});

export const fetchNews = async ({ category, limit = 20, page = 1 } = {}) => {
  const params = { limit, page };
  if (category && category !== 'all') params.category = category;
  const { data } = await api.get('/news', { params });
  return data;
};

export const fetchLatestNews = async () => {
  const { data } = await api.get('/news/latest');
  return data;
};

export const fetchNewsById = async (id) => {
  const { data } = await api.get(`/news/${id}`);
  return data;
};

export const fetchCategories = async () => {
  const { data } = await api.get('/news/categories');
  return data;
};

export const fetchStocks = async () => {
  const { data } = await api.get('/stocks');
  return data;
};

export const fetchTenders = async ({ limit = 20 } = {}) => {
  const { data } = await api.get('/tenders', { params: { limit } });
  return data;
};

export default api;
