import { useEffect, useRef } from 'react';

// TradingView Ticker Tape widget — live prices for Brent, Gold, Silver, NatGas, USD/KWD
export default function MarketWidget() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (containerRef.current.querySelector('script')) return; // already injected

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.text = JSON.stringify({
      symbols: [
        { proName: 'TVC:UKOIL',        title: 'برنت' },
        { proName: 'TVC:GOLD',         title: 'ذهب' },
        { proName: 'TVC:SILVER',       title: 'فضة' },
        { proName: 'TVC:NATGAS',       title: 'غاز' },
        { proName: 'FX_IDC:USDKWD',   title: 'دولار/دينار' },
        { proName: 'TADAWUL:TASI',     title: 'تداول' },
      ],
      showSymbolLogo: true,
      isTransparent: false,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'ar_AE',
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="rounded-lg overflow-hidden shadow-sm">
      <div className="tradingview-widget-container" ref={containerRef}>
        <div className="tradingview-widget-container__widget" />
      </div>
    </div>
  );
}
