export default function CategoryBadge({ category, size = 'sm' }) {
  const sizeClass = size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5';
  return (
    <span className={`inline-block rounded font-bold ${sizeClass} cat-${category}`}>
      {category}
    </span>
  );
}
