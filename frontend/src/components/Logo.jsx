// Al-Qabas Economic Logo — styled SVG matching the newspaper's brand identity
export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { width: 120, height: 40 },
    md: { width: 180, height: 56 },
    lg: { width: 240, height: 72 },
  };
  const { width, height } = sizes[size] || sizes.md;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 240 72"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="القبس الاقتصادي"
    >
      {/* Torch / Flame symbol */}
      <g transform="translate(204, 8)">
        {/* Flame outer */}
        <path
          d="M18 4 C18 4, 28 14, 26 24 C24 30, 20 33, 18 36 C16 33, 12 30, 10 24 C8 14, 18 4, 18 4Z"
          fill="#c9a227"
          opacity="0.9"
        />
        {/* Flame inner */}
        <path
          d="M18 14 C18 14, 23 20, 22 26 C21 29, 19 31, 18 33 C17 31, 15 29, 14 26 C13 20, 18 14, 18 14Z"
          fill="#e8c23a"
          opacity="0.95"
        />
        {/* Torch handle */}
        <rect x="16" y="34" width="4" height="20" rx="2" fill="#c9a227" />
        {/* Torch base */}
        <rect x="13" y="52" width="10" height="4" rx="2" fill="#c9a227" />
        {/* Glow */}
        <ellipse cx="18" cy="20" rx="10" ry="10" fill="#c9a227" opacity="0.15" />
      </g>

      {/* Main Arabic text: القبس */}
      <text
        x="198"
        y="38"
        fontFamily="'Cairo', 'Tajawal', Arial, sans-serif"
        fontSize="32"
        fontWeight="900"
        fill="#ffffff"
        textAnchor="end"
        direction="rtl"
        letterSpacing="-0.5"
      >
        القبس
      </text>

      {/* Subtitle: الاقتصادي */}
      <text
        x="198"
        y="58"
        fontFamily="'Cairo', 'Tajawal', Arial, sans-serif"
        fontSize="14"
        fontWeight="600"
        fill="#c9a227"
        textAnchor="end"
        direction="rtl"
        letterSpacing="1"
      >
        الاقتصادي
      </text>

      {/* Decorative gold line under القبس */}
      <line x1="30" y1="44" x2="198" y2="44" stroke="#c9a227" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}
