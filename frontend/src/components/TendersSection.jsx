import { useEffect, useState } from 'react';
import { fetchTenders } from '../utils/api.js';
import { formatArabicDate } from '../utils/dateUtils.js';

// ── Helpers ──────────────────────────────────────────────

const isArabic = (text) => /[؀-ۿ]/.test(text);

const ARABIC_MONTHS = {
  'يناير': 1, 'فبراير': 2, 'مارس': 3, 'أبريل': 4, 'مايو': 5, 'يونيو': 6,
  'يوليو': 7, 'أغسطس': 8, 'سبتمبر': 9, 'أكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12,
};

function extractOrEstimateClosing(article) {
  const text = `${article.title} ${article.description || ''}`;

  const numMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (numMatch) {
    const d = new Date(parseInt(numMatch[3]), parseInt(numMatch[2]) - 1, parseInt(numMatch[1]));
    if (!isNaN(d.getTime()) && d > new Date()) return d;
  }

  for (const [monthName, monthNum] of Object.entries(ARABIC_MONTHS)) {
    const re = new RegExp(`(\\d{1,2})\\s+${monthName}(?:\\s+(\\d{4}))?`);
    const m = text.match(re);
    if (m) {
      const year = m[2] ? parseInt(m[2]) : new Date().getFullYear();
      const d = new Date(year, monthNum - 1, parseInt(m[1]));
      if (!isNaN(d.getTime())) return d;
    }
  }

  return new Date(new Date(article.pubDate).getTime() + 21 * 24 * 60 * 60 * 1000);
}

function getDeadlineStyle(closingDate) {
  const now = new Date();
  const daysLeft = Math.ceil((closingDate - now) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0)   return { label: 'انتهى الإغلاق',         bg: '#f3f4f6', color: '#9ca3af', border: '#e5e7eb' };
  if (daysLeft === 0) return { label: 'اليوم آخر موعد!',       bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
  if (daysLeft <= 3)  return { label: `إغلاق خلال ${daysLeft} أيام`, bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
  if (daysLeft <= 7)  return { label: `إغلاق خلال ${daysLeft} أيام`, bg: '#fff7ed', color: '#ea580c', border: '#fdba74' };
  if (daysLeft <= 14) return { label: `إغلاق خلال ${daysLeft} يوم`,  bg: '#fffbeb', color: '#d97706', border: '#fcd34d' };
  return { label: `إغلاق خلال ${daysLeft} يوم`, bg: '#f0fdf4', color: '#16a34a', border: '#86efac' };
}

// ── Featured tender card (top 3) ─────────────────────────────────────────
function TenderFeatured({ article }) {
  const closing = extractOrEstimateClosing(article);
  const deadline = getDeadlineStyle(closing);

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
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 tracking-wide">
              مناقصة
            </span>
            {article.source && (
              <span className="text-xs text-gray-400 truncate">{article.source}</span>
            )}
          </div>
          <h4 className="text-sm font-black text-gray-900 leading-snug mb-2 group-hover:text-qabas-red transition-colors line-clamp-2">
            {article.title}
          </h4>
          {article.description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
              {article.description}
            </p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-400">{formatArabicDate(article.pubDate)}</span>
            <span
              className="text-xs font-black px-2.5 py-1 rounded-lg border"
              style={{ background: deadline.bg, color: deadline.color, borderColor: deadline.border }}
            >
              📅 {deadline.label}
            </span>
            <span className="text-xs text-qabas-gold font-bold group-hover:underline">عرض التفاصيل ↗</span>
          </div>
        </div>
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 text-lg">
          📋
        </div>
      </div>
    </a>
  );
}

// ── Regular compact card ─────────────────────────────────────────────
function TenderCard({ article }) {
  const closing = extractOrEstimateClosing(article);
  const deadline = getDeadlineStyle(closing);

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
      <div className="mb-2">
        <span
          className="text-xs font-black px-2.5 py-1 rounded-lg border"
          style={{ background: deadline.bg, color: deadline.color, borderColor: deadline.border }}
        >
          📅 {deadline.label}
        </span>
      </div>
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
    fetchTenders({ limit: 60 })
      .then((res) => { if (res.success) setTenders(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Arabic titles only, and closing date not yet passed
  const arabicTenders = tenders.filter((t) => {
    if (!isArabic(t.title)) return false;
    const closing = extractOrEstimateClosing(t);
    return closing >= new Date();
  });

  const featured = arabicTenders.slice(0, 3);
  const rest = arabicTenders.slice(3);
  const displayedRest = showAll ? rest : rest.slice(0, 6);

  return (
    <section className="mt-2">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="font-black text-qabas-navy text-base section-header">
            المناقصات والعطاءات الحكومية
          </h2>
          {!loading && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-black">
              {arabicTenders.length} مناقصة
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

      {!loading && arabicTenders.length > 0 && (
        <>
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

      {!loading && arabicTenders.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm font-bold">لا توجد مناقصات متاحة حالياً</p>
          <p className="text-xs mt-1 text-gray-300">سيتم تحديث البيانات تلقائياً</p>
        </div>
      )}
    </section>
  );
}
