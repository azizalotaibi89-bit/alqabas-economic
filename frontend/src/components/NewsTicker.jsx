import { useEffect, useState } from 'react';
import { fetchLatestNews } from '../utils/api.js';

export default function NewsTicker() {
  const [headlines, setHeadlines] = useState([]);

  useEffect(() => {
    fetchLatestNews()
      .then((res) => {
        if (res.success) setHeadlines(res.data.map((n) => n.title));
      })
      .catch(() => {
        setHeadlines([
          'بورصة الكويت تغلق على ارتفاع في جلسة اليوم',
          'أسعار النفط تتصاعد مع توترات الشرق الأوسط',
          'بنك الكويت الوطني يحقق أرباحاً قياسية',
          'الذهب يتراجع مع ارتفاع الدولار',
        ]);
      });
  }, []);

  if (!headlines.length) return null;

  const tickerText = headlines.join('  •  ') + '  •  ';

  return (
    <div className="bg-qabas-red text-white py-2 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-0">
        {/* Label */}
        <div className="flex-shrink-0 bg-white text-qabas-red font-black text-xs px-3 py-1 ml-3 breaking-pulse whitespace-nowrap">
          عاجل
        </div>
        {/* Scrolling text */}
        <div className="ticker-container flex-1">
          <span className="ticker-content text-sm font-semibold">
            {tickerText}
          </span>
        </div>
      </div>
    </div>
  );
}
