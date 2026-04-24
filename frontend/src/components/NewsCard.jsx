import { Link } from 'react-router-dom';
import { formatArabicDate } from '../utils/dateUtils.js';
import CategoryBadge from './CategoryBadge.jsx';

function getCategoryGradient(category) {
  const gradients = {
    'أسهم':   'from-blue-900 to-blue-700',
    'نفط':    'from-amber-900 to-amber-700',
    'بنوك':   'from-emerald-900 to-emerald-700',
    'معادن':  'from-yellow-900 to-yellow-700',
    'عقارات': 'from-purple-900 to-purple-700',
    'كويت':   'from-red-900 to-red-700',
    'عام':    'from-gray-800 to-gray-600',
  };
  return gradients[category] || gradients['عام'];
}

function getCategoryAccent(category) {
  const accents = {
    'أسهم':   '#1a5276',
    'نفط':    '#784212',
    'بنوك':   '#1a6b4a',
    'معادن':  '#7d6608',
    'عقارات': '#6c3483',
    'كويت':   '#b30000',
    'عام':    '#2d2d2d',
  };
  return accents[category] || '#0d1b2a';
}

export default function NewsCard({ article, variant = 'default' }) {
  if (!article) return null;

  const gradient = getCategoryGradient(article.category);

  /* ──────── FEATURED ──────── */
  if (variant === 'featured') {
    return (
      <Link to={`/article/${article.id}`} className="block group news-card">
        <article className="relative rounded-xl overflow-hidden h-80" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.18)' }}>
          {article.image ? (
            <img
              src={article.image}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:opacity-75 transition-opacity duration-300"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-b ${gradient}`}>
              <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                <img src="/alqabas-logo.svg" alt="" className="w-20 h-20 rounded-xl" />
              </div>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-transparent" />
          {/* Gold top accent */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-qabas-gold" />
          {/* Content */}
          <div className="absolute bottom-0 right-0 left-0 p-5">
            <CategoryBadge category={article.category} size="lg" />
            <h2 className="text-white text-xl font-black mt-2 leading-snug line-clamp-3 group-hover:text-qabas-gold-light transition-colors">
              {article.title}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-gray-400 text-xs">{formatArabicDate(article.pubDate)}</span>
              {article.source && (
                <span className="text-qabas-gold/80 text-xs font-semibold">• {article.source}</span>
              )}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  /* ──────── COMPACT ──────── */
  if (variant === 'compact') {
    const accent = getCategoryAccent(article.category);
    return (
      <Link to={`/article/${article.id}`} className="block group">
        <article className="flex gap-3 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/80 px-2 rounded-lg transition-colors">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}
          >
            {article.image
              ? <img src={article.image} alt="" className="w-full h-full object-cover" />
              : <span className="text-white/60 text-lg">📰</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-800 mt-0.5 line-clamp-2 group-hover:text-qabas-red transition-colors leading-snug">
              {article.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">{formatArabicDate(article.pubDate)}</span>
              {article.source && <span className="text-xs" style={{ color: accent + 'aa' }}>• {article.source}</span>}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  /* ──────── DEFAULT ──────── */
  const accent = getCategoryAccent(article.category);
  return (
    <Link to={`/article/${article.id}`} className="block group news-card">
      <article
        className="bg-white rounded-xl overflow-hidden h-full flex flex-col"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.07)' }}
      >
        {/* Image */}
        <div className={`h-44 bg-gradient-to-br ${gradient} relative overflow-hidden flex-shrink-0`}>
          {article.image ? (
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-30">
              <img src="/alqabas-logo.svg" alt="" className="w-14 h-14 rounded-lg" />
            </div>
          )}
          {/* Gold top bar */}
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-qabas-gold" />
          {/* Category badge */}
          <div className="absolute top-3 right-3">
            <CategoryBadge category={article.category} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1" style={{ borderRight: `3px solid ${accent}22` }}>
          <h3 className="font-black text-[15px] text-gray-900 leading-snug line-clamp-3 group-hover:text-qabas-red transition-colors flex-1">
            {article.title}
          </h3>
          {article.description && (
            <p className="text-gray-500 text-xs mt-2 line-clamp-2 leading-relaxed">
              {article.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <span className="text-xs text-gray-400">{formatArabicDate(article.pubDate)}</span>
            <span className="text-xs font-bold" style={{ color: accent }}>{article.source}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
