export default function Logo({ size = 'md' }) {
  const cfg = {
    sm: { logoH: 32, engSize: '0.58rem', divH: 24 },
    md: { logoH: 46, engSize: '0.72rem', divH: 34 },
    lg: { logoH: 60, engSize: '0.9rem',  divH: 44 },
  };
  const { logoH, engSize, divH } = cfg[size] || cfg.md;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      userSelect: 'none',
      direction: 'ltr',
    }}>
      {/* "economics" wordmark */}
      <span style={{
        fontFamily: "'Inter','Helvetica Neue', Arial, sans-serif",
        fontSize: engSize,
        fontWeight: 700,
        letterSpacing: '0.18em',
        color: '#C9A84C',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        lineHeight: 1,
      }}>
        economics
      </span>

      {/* Gold divider */}
      <div style={{
        width: 1,
        height: divH,
        background: 'rgba(201,168,76,0.5)',
        flexShrink: 0,
      }} />

      {/* Al-Qabas logo image */}
      <img
        src="/alqabas-logo.svg"
        alt="القبس"
        style={{ height: logoH, width: 'auto', display: 'block' }}
      />
    </div>
  );
}
