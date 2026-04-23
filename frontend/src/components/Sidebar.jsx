import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchNews } from '../utils/api.js';
import { formatArabicDate } from '../utils/dateUtils.js';
import MarketWidget from './MarketWidget.jsx';
import StocksWidget from './StocksWidget.jsx';

export default function Sidebar() {
  const [latestNews, setLatestNews] = useState([]);

  useEffect(() => {
    fetchNews({ limit: 6 })
      .then((res) => { if (res.success) setLatestNews(res.data); })
      .catch(() => {});
  }, []);

  return (
    <aside className="space-y-6">
      {/* Market Indices Widget */}
      <MarketWidget />

      {/* Boursa Kuwait Stocks — Top Gainers / Losers */}
      <StocksWidget />

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
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">{formatArabicDate(article.pubDate)}</span>
                  {article.source && (
                    <span className="text-xs text-qabas-navy/60 font-semibold">• {article.source}</span>
                  )}
                </div>
              </div>
              <svg className="flex-shrink-0 w-4 h-4 text-qabas-gold mt-1 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* News Sources */}
      <div className="bg-qabas-navy rounded-lg p-4">
        <p className="text-qabas-gold font-black text-sm mb-3">مصادر الأخبار</p>
        <div className="space-y-1.5">
          {[
            { name: 'جريدة الأنباء', url: 'https://www.alanba.com.kw' },
            { name: 'جريدة الراي', url: 'https://www.alrai.com' },
            { name: 'جريدة القبس', url: 'https://www.alqabas.com' },
            { name: 'جريدة الوطن', url: 'https://alwatan.com.kw' },
            { name: 'وكالة الأنباء الكويتية (كونا)', url: 'https://www.kuna.net.kw' },
          ].map((src) => (
            <a
              key={src.name}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-gray-300 hover:text-qabas-gold transition-colors"
            >
              <svg className="w-3 h-3 text-qabas-gold/50 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {src.name}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
