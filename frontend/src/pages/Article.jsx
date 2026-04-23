import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchNewsById, fetchNews } from '../utils/api.js';
import { formatFullArabicDate } from '../utils/dateUtils.js';
import CategoryBadge from '../components/CategoryBadge.jsx';
import NewsCard from '../components/NewsCard.jsx';

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

export default function Article() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);

    fetchNewsById(id)
      .then(async (res) => {
        if (res.success) {
          setArticle(res.data);
          // Fetch related
          try {
            const relRes = await fetchNews({ category: res.data.category, limit: 4 });
            if (relRes.success) {
              setRelated(relRes.data.filter((a) => a.id !== id).slice(0, 3));
            }
          } catch {}
        } else {
          setError('لم يتم العثور على هذا المقال');
        }
      })
      .catch(() => setError('تعذر تحميل المقال'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="skeleton h-8 w-2/3 mb-4 rounded" />
        <div className="skeleton h-72 w-full rounded-lg mb-6" />
        <div className="space-y-3">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
          <div className="skeleton h-4 w-4/5 rounded" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">😕</p>
        <p className="text-xl font-bold text-gray-700">{error || 'المقال غير موجود'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-2 bg-qabas-navy text-white rounded-lg hover:bg-qabas-navy-light transition-colors"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const gradient = getCategoryGradient(article.category);

  return (
    <>
      <Helmet>
        <title>{article.title} - القبس الاقتصادي</title>
        <meta name="description" content={article.description} />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-qabas-navy transition-colors">الرئيسية</Link>
          <span className="text-gray-300">›</span>
          <Link to={`/?category=${article.category}`} className="hover:text-qabas-navy transition-colors">
            {article.category}
          </Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 line-clamp-1">{article.title.substring(0, 40)}...</span>
        </nav>

        {/* Article Card */}
        <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Hero image / gradient */}
          <div className={`h-64 md:h-80 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
            {article.image ? (
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <div className="text-6xl opacity-30 mb-4">📰</div>
                <p className="text-white/40 text-sm">{article.source}</p>
              </div>
            )}
            {/* Gold bar */}
            <div className="absolute bottom-0 right-0 left-0 h-1 bg-qabas-gold" />
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Meta */}
            <div className="flex items-center gap-3 mb-4">
              <CategoryBadge category={article.category} size="lg" />
              <span className="text-sm text-qabas-gold font-semibold">{article.source}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-black text-qabas-navy leading-tight mb-4">
              {article.title}
            </h1>

            {/* Date */}
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-6 pb-6 border-b border-gray-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatFullArabicDate(article.pubDate)}
            </div>

            {/* Body text */}
            <div className="text-gray-700 text-lg leading-loose font-medium">
              {article.content || article.description}
            </div>

            {/* Source link */}
            {article.link && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-qabas-navy text-white px-5 py-2.5 rounded-lg hover:bg-qabas-navy-light transition-colors text-sm font-bold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  عرض المصدر الأصلي
                </a>
              </div>
            )}
          </div>
        </article>

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="font-black text-qabas-navy text-xl mb-5 section-header">أخبار ذات صلة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map((a) => (
                <NewsCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-qabas-navy hover:text-qabas-gold transition-colors font-bold"
          >
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            العودة للصفحة السابقة
          </button>
        </div>
      </div>
    </>
  );
}
