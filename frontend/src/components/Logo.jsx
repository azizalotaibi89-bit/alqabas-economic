export default function Logo({ size = 'md' }) {
  const cfg = {
    sm: { fontSize: 36, engSize: '0.58rem', divH: 28 },
    md: { fontSize: 52, engSize: '0.72rem', divH: 38 },
    lg: { fontSize: 68, engSize: '0.9rem',  divH: 50 },
  };
  const { fontSize, engSize, divH } = cfg[size] || cfg.md;
  const starR = fontSize * 0.18; // star radius scales with text

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      userSelect: 'none',
      direction: 'ltr',
      position: 'relative',
    }}>

      {/* ── Logotype block ── */}
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>

        {/* Arabic text "القبس" */}
        <span style={{
          fontFamily: "'Cairo', 'Tajawal', 'Noto Naskh Arabic', serif",
          fontSize,
          fontWeight: 900,
          color: '#ffffff',
          lineHeight: 1,
          direction: 'rtl',
          display: 'block',
          letterSpacing: '-1px',
        }}>
          القبس
        </span>

        {/* Gold starburst — positioned over the letters (like the spark in the real logo) */}
        <svg
          width={starR * 2.8}
          height={starR * 2.8}
          viewBox={`0 0 ${starR * 2.8} ${starR * 2.8}`}
          style={{
            position: 'absolute',
            // Roughly center it horizontally and vertically on the letter body
            left: '36%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        >
          {/* Outer 8-pointed star */}
          <polygon
            points={buildStar(starR * 1.4, starR * 1.4, starR, starR * 0.42, 8)}
            fill="#C9A84C"
          />
          {/* Inner bright core */}
          <polygon
            points={buildStar(starR * 1.4, starR * 1.4, starR * 0.5, starR * 0.22, 8)}
            fill="#ffffff"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Gold divider */}
      <div style={{
        width: 1,
        height: divH,
        background: 'rgba(201,168,76,0.5)',
        flexShrink: 0,
      }} />

      {/* "economics" wordmark */}
      <span style={{
        fontFamily: "'Inter','Helvetica Neue', Arial, sans-serif",
        fontSize: engSize,
        fontWeight: 300,
        letterSpacing: '0.26em',
        color: '#C9A84C',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        lineHeight: 1,
      }}>
        economics
      </span>
    </div>
  );
}

/** Build SVG polygon points string for an n-pointed star */
function buildStar(cx, cy, outerR, innerR, points) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}
