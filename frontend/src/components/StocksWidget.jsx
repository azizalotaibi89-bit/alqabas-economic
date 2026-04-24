import { useEffect, useRef } from 'react';

// TradingView Hotlists widget — top gainers & losers on Kuwait Stock Exchange (KSE)
export default function StocksWidget() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (containerRef.current.querySelector('script')) return;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js';
    script.async = true;
    script.text = JSON.stringify({
      colorTheme: 'light',
      dateRange: '1D',
      exchange: 'KSE',
      showChart: false,
      locale: 'ar_AE',
      largeChartUrl: '',
      isTransparent: false,
      showSymbolLogo: false,
      showFloatingTooltip: false,
      width: '100%',
      height: 380,
    });

    containerRef.current.appendChild(script);
  }, []);

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

      {/* TradingView widget */}
      <div className="tradingview-widget-container" ref={containerRef}>
        <div className="tradingview-widget-container__widget" />
      </div>

      {/* Attribution */}
      <div className="px-3 py-1.5 border-t border-gray-50 bg-gray-50">
        <p className="text-gray-400 text-xs text-center">
          مدعوم من{' '}
          <a href="https://www.tradingview.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
            TradingView
          </a>
        </p>
      </div>
    </div>
  );
}
