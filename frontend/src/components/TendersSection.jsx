import { useEffect, useState } from 'react';
import { fetchTenders } from '../utils/api.js';
import { formatArabicDate } from '../utils/dateUtils.js';

// ── Helpers ────────────────────────────────────────────────────────────────

const isArabic = (text) => /[؀-ۿ]/.test(text);

const ARABIC_MONTHS = {
  'يناير': 1, 'فبراير': 2, 'مارس': 3, 'أبريل': 4, 'مايو': 5, 'يونيو': 6,
  'يوليو': 7, 'أغسطس': 8, 'سبتمبر': 9, 'أكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12,
};

function extractOrEstimateClosing(article) {
  if (article.daysToClose !== undefined) {
    return new Date(Date.now() + article.daysToClose * 86400000);
  }
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
  return new Date(new Date(article.pubDate).getTime() + 90 * 86400000);
}

function getDeadlineStyle(closingDate) {
  const now = new Date();
  const daysLeft = Math.ceil((closingDate - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0)   return { label: 'انتهى الإغلاق',               bg: '#f3f4f6', color: '#9ca3af', border: '#e5e7eb' };
  if (daysLeft === 0) return { label: 'اليوم آخر موعد!',              bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
  if (daysLeft <= 3)  return { label: `إغلاق خلال ${daysLeft} أيام`, bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
  if (daysLeft <= 7)  return { label: `إغلاق خلال ${daysLeft} أيام`, bg: '#fff7ed', color: '#ea580c', border: '#fdba74' };
  if (daysLeft <= 14) return { label: `إغلاق خلال ${daysLeft} يوم`,  bg: '#fffbeb', color: '#d97706', border: '#fcd34d' };
  return { label: `إغلاق خلال ${daysLeft} يوم`, bg: '#f0fdf4', color: '#16a34a', border: '#86efac' };
}

// Category config
const TABS = [
  { key: 'مناقصات', label: 'مناقصات', icon: '📋', color: '#b45309', bg: '#fffbeb', border: '#fcd34d' },
  { key: 'ممارسات', label: 'ممارسات', icon: '📄', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
  { key: 'مزايدات', label: 'مزايدات', icon: '🔨', color: '#15803d', bg: '#f0fdf4', border: '#86efac' },
];

function getTenderType(article) {
  if (article.tenderCategory) return article.tenderCategory;
  const t = article.title + ' ' + (article.description || '');
  if (/مزايدة|مزايدات/.test(t)) return 'مزايدات';
  if (/ممارسة|ممارسات/.test(t)) return 'ممارسات';
  return 'مناقصات';
}

// Extract metadata from description string
function parseMetaFromDesc(desc) {
  const parts = (desc || '').split('|').map(s => s.trim());
  // format: "مناقصات | الكويت اليوم الرسمية | العدد 1787 | date | صفحة 12"
  const edition = parts.find(p => /العدد/.test(p)) || '';
  const page    = parts.find(p => /صفحة/.test(p)) || '';
  const date    = parts.find(p => /\d{4}/.test(p) && !/العدد|صفحة/.test(p)) || '';
  return { edition, page, date };
}

// ── Single tender card ────────────────────────────────────────────────────
function TenderCard({ article, tab }) {
  const closing = extractOrEstimateClosing(article);
  const deadline = getDeadlineStyle(closing);
  const meta = parseMetaFromDesc(article.description);

  return (
    <a
      href={article.link || 'https://kuwaitalyawm.media.gov.kw/online/AdsCategory/1'}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl border p-4 hover:shadow-md transition-all group"
      style={{ borderColor: '#f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      {/* Top row: badge + source */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className="text-xs font-black px-2.5 py-0.5 rounded-full border"
          style={{ background: tab.bg, color: tab.color, borderColor: tab.border }}
        >
          {tab.icon} {tab.label}
        </span>
        <span className="text-xs text-gray-400 truncate">{article.source || 'كويت اليوم'}</span>
      </div>

      {/* Title = tender subject */}
      <h4
        className="text-sm font-black text-gray-900 leading-snug mb-1 group-hover:underline line-clamp-3"
        style={{ direction: 'rtl', textAlign: 'right' }}
      >
        {article.title}
      </h4>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 mb-3">
        {meta.edition && (
          <span className="text-xs text-gray-500 font-medium">{meta.edition}</span>
        )}
        {meta.page && (
          <span className="text-xs text-gray-400">{meta.page}</span>
        )}
        {article.pubDate && (
          <span className="text-xs text-gray-400">{formatArabicDate(article.pubDate)}</span>
        )}
      </div>

      {/* Deadline */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-lg border"
          style={{ background: deadline.bg, color: deadline.color, borderColor: deadline.border }}
        >
          📅 {deadline.label}
        </span>
        <span className="text-xs font-semibold text-qabas-gold group-hover:underline">عرض ↗</span>
      </div>
    </a>
  );
}

// ── Main section ───────────────────────────────────────────────────────────
export default function TendersSection() {
  const [tenders, setTenders]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('مناقصات');
  const [showAll, setShowAll]     = useState(false);

  useEffect(() => {
    fetchTenders({ limit: 300 })
      .then((res) => { if (res.success) setTenders(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Reset showAll when tab changes
  const switchTab = (key) => { setActiveTab(key); setShowAll(false); };

  // Filter: Arabic, not expired, matches tab type
  const byTab = (tabKey) =>
    tenders.filter((t) => {
      if (!isArabic(t.title)) return false;
      const closing = extractOrEstimateClosing(t);
      if (closing < new Date()) return false;
      return getTenderType(t) === tabKey;
    });

  const counts = Object.fromEntries(TABS.map(tab => [tab.key, byTab(tab.key).length]));
  const totalActive = Object.values(counts).reduce((a, b) => a + b, 0);

  const currentTab   = TABS.find(t => t.key === activeTab);
  const currentItems = byTab(activeTab);
  const PAGE_SIZE    = 12;
  const displayed    = showAll ? currentItems : currentItems.slice(0, PAGE_SIZE);

  return (
    <section className="mt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-black text-qabas-navy text-base section-header">
            المناقصات والعطاءات الحكومية
          </h2>
          {!loading && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-black">
              {totalActive} إعلان
            </span>
          )}
        </div>
        <a
          href="https://kuwaitalyawm.media.gov.kw/online/AdsCategory/1"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-qabas-gold hover:underline font-bold"
        >
          كويت اليوم ↗
        </a>
      </div>

      {/* Tabs */}
      {!loading && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black border transition-all duration-200"
              style={
                activeTab === tab.key
                  ? { background: tab.color, color: '#fff', borderColor: tab.color }
                  : { background: '#fff', color: tab.color, borderColor: tab.border }
              }
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-black"
                style={
                  activeTab === tab.key
                    ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                    : { background: tab.bg, color: tab.color }
                }
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 space-y-3">
              <div className="skeleton h-4 w-20 rounded-full" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-3 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Cards grid */}
      {!loading && currentItems.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayed.map((t) => (
              <TenderCard key={t.id} article={t} tab={currentTab} />
            ))}
          </div>

          {currentItems.length > PAGE_SIZE && (
            <div className="text-center mt-5">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-6 py-2 text-sm font-bold text-qabas-navy border-2 border-qabas-navy rounded-full hover:bg-qabas-navy hover:text-white transition-all duration-200"
              >
                {showAll ? 'عرض أقل' : `عرض الكل (${currentItems.length})`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty */}
      {!loading && currentItems.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">{currentTab?.icon || '📋'}</p>
          <p className="text-sm font-bold">لا توجد {activeTab} متاحة حالياً</p>
          <p className="text-xs mt-1 text-gray-300">سيتم التحديث تلقائياً</p>
        </div>
      )}
    </section>
  );
}
