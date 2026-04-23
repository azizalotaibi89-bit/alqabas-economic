import { Link } from 'react-router-dom';
import { formatArabicDate } from '../utils/dateUtils.js';
import CategoryBadge from './CategoryBadge.jsx';

// Default placeholder image based on category
function getCategoryGradient(category) {
  const gradients = {
    'أسهم': 'from-blue-900 to-blue-700',
    'نفط': 'from-amber-900 to-amber-700',
    'بنوك': 'from-emerald-900 to-emerald-700',
    'معادن': 'from-yellow-900 to-yellow-700',
    'عقارات': 'from-purple-900 to-purple-700',
    'كويت': 'from-red-900 to-red-700',
    'عام': 'from-gray-800 to-gray-600',
  };
  return gradients[category] || gradients['عام'];
}

function getCategoryIcon(category) {
  const icons = {
    'أسهم': '📈',
    'نفط': '🛢️',
    'بنوك': '🏦',
    'معادن': '🥇',
    'عقارات': '🏢',
    'كويت': '🇰🇼',
    'عام': '📰',
  };
  return icons[category] || '📰';
}

export default function NewsCard({ article, variant = 'default' }) {
  if (!article) return null;

  const gradient = getCategoryGradient(article.category);
  const icon = getCategoryIcon(article.category);

  if (variant === 'featured') {
    return (
      <Link to={`/article/${article.id}`} className="block group news-card">
        <article className="relative bg-qabas-navy rounded-lg overflow-hidden h-80">
          {/* Background */}
          {article.image ? (
            <img
              src={article.image}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-b ${gradient} opacity-80`}>
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <img src="/alqabas-logo.svg" alt="" className="w-20 h-20 rounded-xl opacity-60" />
                <span className="text-white/50 text-sm font-semibold">القبس الاقتصادي</span>
              </div>
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          {/* Content */}
          <div className="absolute bottom-0 right-0 left-0 p-5">
            <CategoryBadge category={article.category} size="lg" />
            <h2 className="text-white text-xl font-black mt-2 leading-tight line-clamp-3 group-hover:text-qabas-gold-light transition-colors">
              {article.title}
            </h2>
            <p className="text-gray-300 text-sm mt-1">{formatArabicDate(article.pubDate)}</p>
          </div>
          {/* Gold top border */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-qabas-gold" />
        </article>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link to={`/article/${article.id}`} className="block group">
        <article className="flex gap-3 py-3 border-b border-qabas-border last:border-0 hover:bg-gray-50 px-2 rounded transition-colors">
          {/* Icon / thumbnail */}
          <div className={`flex-shrink-0 w-14 h-14 rounded bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl`}>
            {article.image
              ? <img src={article.image} alt="" className="w-full h-full object-cover rounded" />
              : icon
            }
          </div>
          <div className="flex-1 min-w-0">
            <CategoryBadge category={article.category} />
            <h3 className="text-sm font-bold text-qabas-gray-dark mt-1 line-clamp-2 group-hover:text-qabas-red transition-colors leading-snug">
              {article.title}
            </h3>
            <span className="text-xs text-gray-400">{formatArabicDate(article.pubDate)}</span>
          </div>
        </article>
      </Link>
    );
  }

  // default card
  return (
    <Link to={`/article/${article.id}`} className="block group news-card">
      <article className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 h-full flex flex-col">
        {/* Image area */}
        <div className={`h-44 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
          {article.image ? (
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          {/* Placeholder shown when no image or image fails to load */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ display: article.image ? 'none' : 'flex' }}
          >
            <img src="/alqabas-logo.svg" alt="" className="w-16 h-16 rounded-lg opacity-70" />
            <span className="text-white/60 text-xs font-semibold tracking-wide">القبس الاقتصادي</span>
          </div>
          {/* Gold bar top */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-qabas-gold" />
          {/* Category badge overlay */}
          <div className="absolute top-3 right-3">
            <CategoryBadge category={article.category} />
          </div>
        </div>
        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-black text-base text-qabas-gray-dark leading-snug line-clamp-3 group-hover:text-qabas-red transition-colors flex-1">
            {article.title}
          </h3>
          {article.description && (
            <p className="text-gray-500 text-sm mt-2 line-clamp-2 leading-relaxed">
              {article.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">{formatArabicDate(article.pubDate)}</span>
            <span className="text-xs text-qabas-gold font-semibold">{article.source}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
