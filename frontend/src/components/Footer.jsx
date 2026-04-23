import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-qabas-navy text-gray-300 mt-12">
      {/* Gold top border */}
      <div className="h-1 bg-gradient-to-l from-qabas-gold via-qabas-gold-light to-transparent" />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Logo size="md" />
            <p className="text-sm text-gray-400 mt-3 leading-relaxed">
              بوابتك الإخبارية الاقتصادية في الكويت. نقدم آخر أخبار الأسواق المالية والاقتصاد الكويتي والخليجي على مدار الساعة.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-qabas-gold font-black mb-4 text-sm section-header">أقسام الموقع</h4>
            <ul className="space-y-2 text-sm">
              {['أسهم', 'نفط', 'بنوك', 'عقارات', 'معادن', 'الكويت'].map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/?category=${cat}`}
                    className="hover:text-qabas-gold transition-colors flex items-center gap-2"
                  >
                    <span className="text-qabas-gold/40">›</span>
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Info */}
          <div>
            <h4 className="text-qabas-gold font-black mb-4 text-sm section-header">تواصل معنا</h4>
            <a
              href="https://twitter.com/thekstocks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-qabas-navy-light hover:bg-qabas-gold/20 border border-qabas-gold/30 rounded-lg px-4 py-2 text-sm transition-colors"
            >
              <svg className="w-4 h-4 text-qabas-gold" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.737l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>@thekstocks على إكس</span>
            </a>
            <p className="text-xs text-gray-500 mt-6">
              المحتوى مصدره حساب @thekstocks على منصة إكس. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>© {year} القبس الاقتصادي. جميع الحقوق محفوظة.</p>
          <p>مصدر الأخبار: <a href="https://twitter.com/thekstocks" className="text-qabas-gold hover:underline" target="_blank" rel="noopener noreferrer">@thekstocks</a></p>
        </div>
      </div>
    </footer>
  );
}
