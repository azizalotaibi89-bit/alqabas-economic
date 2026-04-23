import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchNews } from '../utils/api.js';
import NewsCard from '../components/NewsCard.jsx';
import Sidebar from '../components/Sidebar.jsx';

const CATEGORIES = ['الكل', 'أسهم', 'نفط', 'بنوك', 'عقارات', 'معادن', 'كويت', 'عام'];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
      <div className="skeleton h-44 w-full" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-1/3 mt-4" />
      </div>
    </div>
  );
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'الكل';
  const searchParam = searchParams.get('search') || '';

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(categoryParam);

  const loadNews = useCallback(async (category) => {
    setLoading(true);
    setError(null);
    try {
      const cat = category === 'الكل' ? undefined : category;
      const res = await fetchNews({ category: cat, limit: 100 });
      if (res.success) {
        let data = res.data;
        // Client-side search filter
        if (searchParam) {
          data = data.filter(
            (a) =>
              a.title.includes(searchParam) ||
              a.description?.includes(searchParam)
          );
        }
        setArticles(data);
      }
    } catch (err) {
      setError('تعذر تحميل الأخبار. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  }, [searchParam]);

  useEffect(() => {
    setActiveCategory(categoryParam);
    loadNews(categoryParam);
  }, [categoryParam, searchParam, loadNews]);

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    if (cat === 'الكل') {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  };

  const featuredArticle = articles[0];
  const gridArticles = articles.slice(1);

  return (
    <>
      <Helmet>
        <title>
          {searchParam
            ? `نتائج: ${searchParam} - القبس الاقتصادي`
            : activeCategory !== 'الكل'
            ? `${activeCategory} - القبس الاقتصادي`
            : 'القبس الاقتصادي - أخبار الاقتصاد والأسواق الكويتية'}
        </title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search result banner */}
        {searchParam && (
          <div className="mb-4 bg-qabas-navy text-white rounded-lg px-4 py-3 flex items-center justify-between">
            <p className="text-sm">
              نتائج البحث عن: <strong className="text-qabas-gold">&quot;{searchParam}&quot;</strong>
              {' '}({articles.length} نتيجة)
            </p>
            <button
              onClick={() => setSearchParams({})}
              className="text-gray-400 hover:text-white text-sm"
            >
              مسح
            </button>
          </div>
        )}

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-qabas-navy text-qabas-gold shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-qabas-navy hover:text-qabas-navy'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-16 text-red-600">
            <p className="text-lg font-bold">{error}</p>
            <button
              onClick={() => loadNews(activeCategory)}
              className="mt-4 px-6 py-2 bg-qabas-navy text-white rounded-lg hover:bg-qabas-navy-light transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <div className="space-y-6">
              <div className="skeleton h-64 rounded-lg" />
              <div className="skeleton h-80 rounded-lg" />
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {articles.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-4xl mb-4">📰</p>
                <p className="text-lg font-bold">لا توجد أخبار في هذا القسم حالياً</p>
                <p className="text-sm mt-2">جرب تصفح قسم آخر أو العودة للرئيسية</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Featured Article */}
                  {featuredArticle && !searchParam && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <h2 className="font-black text-qabas-navy text-base section-header">الخبر الرئيسي</h2>
                      </div>
                      <NewsCard article={featuredArticle} variant="featured" />
                    </div>
                  )}

                  {/* Section header for grid */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-black text-qabas-navy text-base section-header">
                        {searchParam ? `نتائج البحث` : activeCategory === 'الكل' ? 'آخر الأخبار' : activeCategory}
                      </h2>
                      <button
                        onClick={() => loadNews(activeCategory)}
                        className="text-xs text-qabas-gold hover:underline flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        تحديث
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {(searchParam ? articles : gridArticles).map((article) => (
                        <NewsCard key={article.id} article={article} variant="default" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div>
                  <Sidebar />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
