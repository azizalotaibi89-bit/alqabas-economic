export default function Logo({ size = 'md' }) {
    const cfg = {
          sm: { fontSize: 36, engSize: '0.58rem', divH: 28 },
          md: { fontSize: 52, engSize: '0.72rem', divH: 38 },
          lg: { fontSize: 68, engSize: '0.9rem',  divH: 50 },
    };
    const { fontSize, engSize, divH } = cfg[size] || cfg.md;

  return (
        <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 14,
                userSelect: 'none',
                direction: 'ltr',
        }}>
          {/* "economics" wordmark — LEFT side */}
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
                </span>span>

          {/* Gold divider */}
                <div style={{
                  width: 1,
                  height: divH,
                  background: 'rgba(201,168,76,0.5)',
                  flexShrink: 0,
        }} />

          {/* Arabic text */}
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
                </span>span>
        </div>div>
      );
}
