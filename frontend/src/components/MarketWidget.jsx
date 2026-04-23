// Static market widget showing key indices
// In production, wire to a free finance API like Yahoo Finance / Alpha Vantage

const MARKET_DATA = [
  { name: 'المؤشر العام', symbol: 'KSE', value: '7,842.5', change: '+0.85%', up: true },
  { name: 'برنت', symbol: 'BRENT', value: '$88.20', change: '+1.2%', up: true },
  { name: 'ذهب', symbol: 'GOLD', value: '$2,148', change: '-0.3%', up: false },
  { name: 'دولار/دينار', symbol: 'USD/KWD', value: '0.3071', change: '0.0%', up: null },
];

export default function MarketWidget() {
  return (
    <div className="bg-qabas-navy rounded-lg p-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-qabas-gold/20">
        <h3 className="font-black text-qabas-gold text-sm">المؤشرات المالية</h3>
        <span className="text-xs text-gray-400">تحديث مستمر</span>
      </div>

      {/* Market rows */}
      <div className="space-y-3">
        {MARKET_DATA.map((item) => (
          <div key={item.symbol} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">{item.name}</p>
              <p className="text-xs text-gray-400">{item.symbol}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{item.value}</p>
              <p className={`text-xs font-semibold ${
                item.up === true ? 'text-green-400' :
                item.up === false ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {item.up === true ? '▲' : item.up === false ? '▼' : '—'} {item.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-gray-500 text-xs mt-4 pt-3 border-t border-white/10">
        * البيانات للأغراض التوضيحية فقط
      </p>
    </div>
  );
}
