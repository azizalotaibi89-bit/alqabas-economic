import { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
    const [phase, setPhase] = useState('visible');

  useEffect(() => {
        const hold = setTimeout(() => setPhase('fading'), 1600);
        const gone = setTimeout(() => {
                setPhase('gone');
                onDone?.();
        }, 2400);
        return () => { clearTimeout(hold); clearTimeout(gone); };
  }, [onDone]);

  if (phase === 'gone') return null;

  return (
        <div
                style={{
                          position: 'fixed',
                          inset: 0,
                          zIndex: 9999,
                          background: '#0a1628',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 16,
                          opacity: phase === 'fading' ? 0 : 1,
                          transition: 'opacity 0.8s ease',
                          pointerEvents: phase === 'fading' ? 'none' : 'auto',
                }}
              >
              <span
                        style={{
                                    fontFamily: "'Cairo','Tajawal','Noto Naskh Arabic',serif",
                                    fontSize: 'clamp(72px, 16vw, 130px)',
                                    fontWeight: 900,
                                    color: '#ffffff',
                                    lineHeight: 1,
                                    direction: 'rtl',
                                    letterSpacing: '-2px',
                        }}
                      >
                      القبس
              </span>span>
        
              <div
                        style={{
                                    width: 60,
                                    height: 1,
                                    background: '#C9A84C',
                                    opacity: 0.7,
                        }}
                      />
        
              <span
                        style={{
                                    fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif",
                                    fontSize: 'clamp(11px, 2vw, 15px)',
                                    fontWeight: 700,
                                    letterSpacing: '0.35em',
                                    color: '#C9A84C',
                                    textTransform: 'uppercase',
                        }}
                      >
                      economics
              </span>span>
        </div>div>
      );
}</div>
