import { useEffect, useState } from 'react';
import { fetchTenders } from '../utils/api.js';
import { formatArabicDate } from '../utils/dateUtils.js';

function TenderCard({ article }) {
  return (
    <a
      href={article.link || 'https://capt.gov.kw/en/tenders/opening-tenders/'}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg border border-gray-100 shadow-sm p-4 hover:border-qabas-gold/50 hover:shadow-md transition-all group"
    >
      {/* Badge + source */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
          مناقصة
        </span>
        {article.source && (
          <span className="text-xs text-gray-400 truncate">{article.source}</span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-bold text-gray-800 leading-snug mb-2 group-hover:text-qabas-red transition-colors line-clamp-3">
        {article.title}
      </h4>

      {/* Description */}
      {article.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {article.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-400">{formatArabicDate(article.pubDate)}</span>
        <span className="text-xs text-qabas-gold font-semibold group-hover:underline">
          عرض التفاصيل ↗
        </span>
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

  const displayed = showAll ? tenders : tenders.slice(0, 6);

  return (
    <section className="mt-2">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-black text-qabas-navy text-base section-header">
            المناقصات والعطاءات الحكومية
          </h2>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
            {tenders.length} مناقصة
          </span>
        </div>
        <a
          href="https://capt.gov.kw/en/tenders/opening-tenders/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-qabas-gold hover:underline font-semibold"
        >
          CAPT ↗
        </a>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
              <div className="skeleton h-4 w-16 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-3 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Tenders grid */}
      {!loading && tenders.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((tender) => (
              <TenderCard key={tender.id} article={tender} />
            ))}
          </div>
          {tenders.length > 6 && (
            <div className="text-center mt-4">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-6 py-2 text-sm font-bold text-qabas-navy border border-qabas-navy rounded-full hover:bg-qabas-navy hover:text-white transition-colors"
              >
                {showAll ? 'عرض أقل' : `عرض الكل (${tenders.length})`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty */}
      {!loading && tenders.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm font-bold">لا توجد مناقصات متاحة حالياً</p>
          <p className="text-xs mt-1 text-gray-300">سيتم تحديث البيانات خلال ساعتين</p>
        </div>
      )}
    </section>
  );
}
