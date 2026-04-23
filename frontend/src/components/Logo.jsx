export default function Logo({ size = 'md' }) {
  const cfg = {
    sm: { arabicSize: '1.7rem', engSize: '0.6rem', starSize: 18, gap: 10 },
    md: { arabicSize: '2.4rem', engSize: '0.72rem', starSize: 22, gap: 12 },
    lg: { arabicSize: '3rem',   engSize: '0.85rem', starSize: 28, gap: 14 },
  };
  const { arabicSize, engSize, starSize, gap } = cfg[size] || cfg.md;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap,
      userSelect: 'none',
      direction: 'ltr',
    }}>
      {/* Gold star spark */}
      <svg width={starSize} height={starSize} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <polygon
          points="12,1 14,9 22,12 14,15 12,23 10,15 2,12 10,9"
          fill="#C9A84C"
        />
      </svg>

      {/* Arabic logotype — plain HTML text, no SVG */}
      <span style={{
        fontFamily: "'Noto Naskh Arabic', 'Cairo', 'Amiri', 'Traditional Arabic', 'Arial Unicode MS', serif",
        fontSize: arabicSize,
        fontWeight: 900,
        color: '#ffffff',
        lineHeight: 1,
        direction: 'rtl',
        letterSpacing: '-0.5px',
      }}>
        القبس
      </span>

      {/* Gold divider */}
      <div style={{
        width: 1,
        height: '1.8rem',
        background: 'rgba(201,168,76,0.5)',
        flexShrink: 0,
      }} />

      {/* "economics" wordmark */}
      <span style={{
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        fontSize: engSize,
        fontWeight: 300,
        letterSpacing: '0.25em',
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
