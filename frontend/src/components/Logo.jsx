export default function Logo({ size = 'md' }) {
  const scales = { sm: 0.7, md: 1, lg: 1.35 };
  const s = scales[size] || 1;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      userSelect: 'none',
      transform: `scale(${s})`,
      transformOrigin: 'right center',
    }}>
      {/* Inline SVG — no external file dependency */}
      <svg
        viewBox="0 0 260 64"
        width="260"
        height="64"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', flexShrink: 0 }}
      >
        {/* Gold spark / star */}
        <g transform="translate(18,32)">
          <polygon
            points="0,-11 2,-2 11,0 2,2 0,11 -2,2 -11,0 -2,-2"
            fill="#C9A84C"
          />
        </g>
        {/* القبس — large bold Arabic */}
        <text
          x="248"
          y="47"
          fontFamily="'Noto Naskh Arabic','Cairo','Traditional Arabic',serif"
          fontSize="52"
          fontWeight="900"
          fill="#ffffff"
          textAnchor="end"
          direction="rtl"
        >
          القبس
        </text>
      </svg>

      {/* Thin gold divider */}
      <div style={{
        width: '1px',
        height: '40px',
        background: 'rgba(201,168,76,0.45)',
        flexShrink: 0,
      }} />

      {/* "economics" wordmark */}
      <span style={{
        fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif",
        fontSize: '11px',
        fontWeight: 300,
        letterSpacing: '0.22em',
        color: '#C9A84C',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>
        economics
      </span>
    </div>
  );
}
