import { useEffect, useState } from 'react';
import { fetchTenders } from '../utils/api.js';
import { formatArabicDate } from '../utils/dateUtils.js';

/* ── Featured tender card (top 3) ── */
function TenderFeatured({ article }) {
  return (
    <a
      href={article.link || 'https://capt.gov.kw/en/tenders/opening-tenders/'}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl p-4 tender-featured group"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Badge + source */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 tracking-wide">
              مناقصة
            </span>
            {article.source && (
              <span className="text-xs text-gray-400 truncate">{article.source}</span>
            )}
          </div>
          {/* Title */}
          <h4 className="text-sm font-black text-gray-900 leading-snug mb-2 group-hover:text-qabas-red transition-colors line-clamp-2">
            {article.title}
          </h4>
          {/* Description */}
          {article.description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
              {article.description}
            </p>
          )}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{formatArabicDate(article.pubDate)}</span>
            <span className="text-xs text-qabas-gold font-bold group-hover:underline">عرض التفاصيل ↗</span>
          </div>
        </div>
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 text-lg">
          📋
        </div>
      </div>
    </a>
  );
}

/* ── Regular compact card ── */
function TenderCard({ article }) {
  return (
    <a
      href={article.link || 'https://capt.gov.kw/en/tenders/opening-tenders/'}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-amber-300 hover:shadow-md transition-all group"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          مناقصة
        </span>
        {article.source && (
          <span className="text-xs text-gray-400 truncate">{article.source}</span>
        )}
      </div>
      <h4 className="text-sm font-bold text-gray-800 leading-snug mb-2 group-hover:text-qabas-red transition-colors line-clamp-2">
        {article.title}
      </h4>
      {article.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {article.description}
        </p>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-400">{formatArabicDate(article.pubDate)}</span>
        <span className="text-xs text-qabas-gold font-semibold group-hover:underline">التفاصيل ↗</span>
      </div>
    </a>
  );
}

export default function TendersSection() {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchTenders({ limit: 40 })
      .then((res) => { if (res.success) setTenders(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featured = tenders.slice(0, 3);
  const rest = tenders.slice(3);
  const displayedRest = showAll ? rest : rest.slice(0, 6);

  return (
    <section className="mt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="font-black text-qabas-navy text-base section-header">
            المناقصات والعطاءات الحكومية
          </h2>
          {!loading && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-black">
              {tenders.length} مناقصة
            </span>
          )}
        </div>
        <a
          href="https://capt.gov.kw/en/tenders/opening-tenders/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-qabas-gold hover:underline font-bold"
        >
          جهاز المناقصات ↗
        </a>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 space-y-3">
              <div className="skeleton h-4 w-16 rounded-full" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-3 w-3/4 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {!loading && tenders.length > 0 && (
        <>
          {/* Latest 3 — featured */}
          {featured.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-0.5 bg-amber-400 rounded inline-block" />
                الأحدث
              </p>
              <div className="space-y-3">
                {featured.map((t) => (
                  <TenderFeatured key={t.id} article={t} />
                ))}
              </div>
            </div>
          )}

          {/* Rest — grid */}
          {rest.length > 0 && (
            <>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-0.5 bg-gray-300 rounded inline-block" />
                المزيد
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayedRest.map((t) => (
                  <TenderCard key={t.id} article={t} />
                ))}
              </div>
              {rest.length > 6 && (
                <div className="text-center mt-5">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="px-6 py-2 text-sm font-bold text-qabas-navy border-2 border-qabas-navy rounded-full hover:bg-qabas-navy hover:text-white transition-all duration-200"
                  >
                    {showAll ? 'عرض أقل' : `عرض الكل (${rest.length})`}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Empty */}
      {!loading && tenders.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm font-bold">لا توجد مناقصات متاحة حالياً</p>
          <p className="text-xs mt-1 text-gray-300">سيتم تحديث البيانات تلقائياً</p>
        </div>
      )}
    </section>
  );
}
