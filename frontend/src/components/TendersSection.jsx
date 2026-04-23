import { useEffect, useState } from 'react';
import { fetchTenders } from '../utils/api.js';

function TenderCard({ tender }) {
  const typeColor =
    tender.type?.includes('دولي')
      ? 'bg-purple-100 text-purple-700'
      : tender.type?.includes('ممارسة')
      ? 'bg-blue-100 text-blue-700'
      : 'bg-amber-100 text-amber-700';

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 hover:border-qabas-gold/40 transition-colors">
      {/* Top row: number + type badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {tender.tenderNo && (
            <span className="text-xs text-gray-400 font-mono">#{tender.tenderNo}</span>
          )}
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColor}`}>
            {tender.type || 'مناقصة'}
          </span>
        </div>
      </div>

      {/* Subject */}
      <h4 className="text-sm font-bold text-gray-800 leading-snug mb-2">{tender.subject}</h4>

      {/* Organization */}
      {tender.organization && (
        <p className="text-xs text-qabas-navy font-semibold mb-3 flex items-center gap-1">
          <span>🏛</span>
          {tender.organization}
        </p>
      )}

      {/* Deadline */}
      {tender.deadline && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
          <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-red-600 font-semibold">
            آخر موعد: {tender.deadline}
          </span>
        </div>
      )}

      {/* Link to CAPT */}
      <a
        href={tender.link || 'https://capt.gov.kw/en/tenders/opening-tenders/'}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs text-qabas-gold hover:underline font-semibold"
      >
        عرض التفاصيل ↗
      </a>
    </div>
  );
}

export default function TendersSection() {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchTenders({ limit: 20 })
      .then((res) => {
        if (res.success) setTenders(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayed = showAll ? tenders : tenders.slice(0, 6);

  return (
    <section className="mt-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-black text-qabas-navy text-base section-header">
            المناقصات والممارسات الحكومية
          </h2>
          <span className="text-xs bg-qabas-navy text-qabas-gold px-2 py-0.5 rounded-full font-bold">
            ديوان الخدمة المدنية
          </span>
        </div>
        <a
          href="https://capt.gov.kw/en/tenders/opening-tenders/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-qabas-gold hover:underline font-semibold"
        >
          كل المناقصات ↗
        </a>
      </div>

      {/* Source attribution */}
      <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        المصدر: الجهاز المركزي للمناقصات العامة (CAPT) — كويت اليوم
      </p>

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
              <TenderCard key={tender.id} tender={tender} />
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
        </div>
      )}
    </section>
  );
}
