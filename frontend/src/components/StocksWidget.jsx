import { useEffect, useState } from 'react';
import { fetchStocks } from '../utils/api.js';

function StockRow({ stock, type }) {
  const isUp = type === 'gainer';
  const pct = stock.changePercent?.toFixed(2) ?? '0.00';
  const price = stock.lastPrice?.toFixed(3) ?? '0.000';

  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-800 truncate leading-tight">{stock.name}</p>
        <p className="text-xs text-gray-400">{stock.symbol}</p>
      </div>
      <div className="text-right flex-shrink-0 mr-2">
        <p className="text-xs font-bold text-gray-700">{price}</p>
        <p className={`text-xs font-bold ${isUp ? 'text-green-600' : 'text-red-600'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(pct)}%
        </p>
      </div>
    </div>
  );
}

export default function StocksWidget() {
  const [stocks, setStocks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('gainers'); // 'gainers' | 'losers'

  useEffect(() => {
    fetchStocks()
      .then((res) => {
        if (res.success) setStocks(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const list = activeTab === 'gainers' ? stocks?.gainers : stocks?.losers;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-qabas-navy px-4 py-3 flex items-center justify-between">
        <h3 className="text-qabas-gold font-black text-sm">بورصة الكويت</h3>
        <a
          href="https://www.boursakuwait.com.kw"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-qabas-gold text-xs transition-colors"
        >
          ↗ المزيد
        </a>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('gainers')}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${
            activeTab === 'gainers'
              ? 'text-green-700 border-b-2 border-green-600 bg-green-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ▲ أعلى ارتفاعاً
        </button>
        <button
          onClick={() => setActiveTab('losers')}
          className={`flex-1 py-2 text-xs font-bold transition-colors ${
            activeTab === 'losers'
              ? 'text-red-700 border-b-2 border-red-600 bg-red-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ▼ أكثر انخفاضاً
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="divide-y divide-gray-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3">
              <div className="space-y-1 flex-1">
                <div className="skeleton h-3 w-28 rounded" />
                <div className="skeleton h-2 w-12 rounded" />
              </div>
              <div className="space-y-1 text-right">
                <div className="skeleton h-3 w-14 rounded" />
                <div className="skeleton h-2 w-12 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : list && list.length > 0 ? (
        <div className="divide-y divide-gray-50">
          {list.map((stock, i) => (
            <StockRow key={stock.symbol || i} stock={stock} type={activeTab === 'gainers' ? 'gainer' : 'loser'} />
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-gray-400 text-xs">
          <p>لا تتوفر بيانات حالياً</p>
        </div>
      )}

      {stocks?.isMock && (
        <p className="text-gray-400 text-xs text-center py-2 border-t border-gray-50">
          * بيانات تجريبية — تحديث قريباً
        </p>
      )}
    </div>
  );
}
