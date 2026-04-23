// Al-Qabas logo using the official brand image
export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { height: 36 },
    md: { height: 52 },
    lg: { height: 68 },
  };
  const { height } = sizes[size] || sizes.md;

  return (
    <img
      src="/alqabas-logo.svg"
      alt="القبس الاقتصادي"
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
}
