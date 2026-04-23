import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import NewsTicker from './components/NewsTicker.jsx';
import Home from './pages/Home.jsx';
import Article from './pages/Article.jsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-qabas-gray font-arabic" dir="rtl">
      {/* Sticky Header */}
      <Header />

      {/* Breaking News Ticker */}
      <NewsTicker />

      {/* Main Content */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/article/:id" element={<Article />} />
          <Route path="*" element={
            <div className="text-center py-24">
              <p className="text-6xl mb-4">404</p>
              <p className="text-xl font-bold text-gray-600">الصفحة غير موجودة</p>
              <a href="/" className="mt-4 inline-block text-qabas-navy hover:underline font-bold">
                العودة للرئيسية
              </a>
            </div>
          } />
        </Routes>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
