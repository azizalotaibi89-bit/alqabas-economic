// Typographic logo — no image dependency
export default function Logo({ size = 'md' }) {
  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.3 : 1;

  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: 'right center', lineHeight: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
        <span style={{
          fontFamily: "'Noto Naskh Arabic', 'Traditional Arabic', 'Cairo', serif",
          fontSize: '1.6rem',
          fontWeight: 900,
          color: '#C9A84C',
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
        }}>
          القبس
        </span>
        <span style={{
          fontFamily: "'Noto Naskh Arabic', 'Traditional Arabic', 'Cairo', serif",
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#e5e5e5',
          letterSpacing: '0.08em',
          lineHeight: 1.2,
        }}>
          الاقتصادي
        </span>
      </div>
    </div>
  );
}
