import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';

const NAV_LINKS = [
  { label: 'الرئيسية', path: '/' },
  { label: 'أسهم', path: '/?category=أسهم' },
  { label: 'نفط', path: '/?category=نفط' },
  { label: 'بنوك', path: '/?category=بنوك' },
  { label: 'عقارات', path: '/?category=عقارات' },
  { label: 'معادن', path: '/?category=معادن' },
  { label: 'الكويت', path: '/?category=كويت' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // Current date in Arabic
  const arabicDate = new Date().toLocaleDateString('ar-KW', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="w-full sticky top-0 z-50 shadow-lg">
      {/* Top utility bar */}
      <div className="bg-qabas-navy-light border-b border-qabas-gold/20">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-xs text-gray-400">
          <span>{arabicDate}</span>
          <span className="text-qabas-gold/70">الكويت • Kuwait</span>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-qabas-navy">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo size="md" />
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center bg-qabas-navy-light border border-qabas-gold/30 rounded-lg overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الأخبار..."
              className="bg-transparent text-white placeholder-gray-400 px-4 py-2 text-sm outline-none w-56 text-right"
              dir="rtl"
            />
            <button
              type="submit"
              className="bg-qabas-gold hover:bg-qabas-gold-light transition-colors px-3 py-2"
            >
              <svg className="w-4 h-4 text-qabas-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white p-2"
            aria-label="القائمة"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation bar */}
      <nav className="bg-qabas-navy border-t border-qabas-gold/20">
        <div className="max-w-7xl mx-auto px-4">
          <ul className={`flex flex-wrap gap-0 ${menuOpen ? 'flex' : 'hidden md:flex'}`}>
            {NAV_LINKS.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold text-gray-200 hover:text-qabas-gold hover:bg-qabas-navy-light transition-all duration-200 border-b-2 border-transparent hover:border-qabas-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
