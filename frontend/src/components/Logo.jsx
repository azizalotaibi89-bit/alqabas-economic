export default function Logo({ size = 'md' }) {
  const heights = { sm: 38, md: 52, lg: 68 };
  const h = heights[size] || 52;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
      {/* Al-Qabas logotype image */}
      <img
        src="/alqabas-logo.svg"
        alt="القبس"
        style={{ height: h, width: 'auto', display: 'block', filter: 'brightness(0) invert(1)' }}
      />

      {/* Divider */}
      <div style={{
        width: '1px',
        height: h * 0.55,
        background: 'rgba(201,168,76,0.5)',
        flexShrink: 0,
      }} />

      {/* "economics" wordmark */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1 }}>
        <span style={{
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: h * 0.28,
          fontWeight: 300,
          letterSpacing: '0.18em',
          color: '#C9A84C',
          textTransform: 'uppercase',
        }}>
          economics
        </span>
      </div>
    </div>
  );
}
