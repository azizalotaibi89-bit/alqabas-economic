import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchNews } from '../utils/api.js';
import { formatArabicDate } from '../utils/dateUtils.js';
import MarketWidget from './MarketWidget.jsx';

export default function Sidebar() {
  const [latestNews, setLatestNews] = useState([]);

  useEffect(() => {
    fetchNews({ limit: 6 })
      .then((res) => { if (res.success) setLatestNews(res.data); })
      .catch(() => {});
  }, []);

  return (
    <aside className="space-y-6">
      {/* Market Widget */}
      <MarketWidget />

      {/* Latest News */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-qabas-navy px-4 py-3">
          <h3 className="text-qabas-gold font-black text-sm">آخر الأخبار</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {latestNews.map((article) => (
            <Link
              key={article.id}
              to={`/article/${article.id}`}
              className="flex gap-2 p-3 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-qabas-red transition-colors leading-snug">
                  {article.title}
                </p>
                <span className="text-xs text-gray-400 mt-1 block">{formatArabicDate(article.pubDate)}</span>
              </div>
              <svg className="flex-shrink-0 w-4 h-4 text-qabas-gold mt-1 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Follow on X */}
      <div className="bg-qabas-navy rounded-lg p-4 text-center">
        <p className="text-qabas-gold font-black text-sm mb-2">تابعنا على منصة إكس</p>
        <a
          href="https://twitter.com/thekstocks"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-qabas-navy font-bold text-sm px-4 py-2 rounded-full hover:bg-qabas-gold hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.737l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          @thekstocks
        </a>
        <p className="text-gray-400 text-xs mt-2">أخبار الأسواق الكويتية</p>
      </div>
    </aside>
  );
}
