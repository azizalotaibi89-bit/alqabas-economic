import { useEffect, useRef } from 'react';

// TradingView Market Quotes widget — live prices for KSE, Brent, Gold, USD/KWD
export default function MarketWidget() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (containerRef.current.querySelector('script')) return; // already injected

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
    script.async = true;
    script.text = JSON.stringify({
      width: '100%',
      symbolsGroups: [
        {
          name: 'بورصة الكويت',
          symbols: [
            { name: 'KSE:KWSEALL', displayName: 'المؤشر العام' },
          ],
        },
        {
          name: 'السلع',
          symbols: [
            { name: 'NYMEX:BZ1!', displayName: 'برنت' },
            { name: 'COMEX:GC1!', displayName: 'ذهب' },
          ],
        },
        {
          name: 'العملات',
          symbols: [
            { name: 'FX:USDKWD', displayName: 'دولار/دينار' },
          ],
        },
      ],
      showSymbolLogo: false,
      isTransparent: false,
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
