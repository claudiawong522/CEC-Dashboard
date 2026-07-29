export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="cent-gradient" x1="0" y1="32" x2="32" y2="0">
          <stop offset="0%" stopColor="#E8583D" />
          <stop offset="35%" stopColor="#E0B94A" />
          <stop offset="65%" stopColor="#3FA789" />
          <stop offset="100%" stopColor="#3B6FC2" />
        </linearGradient>
      </defs>
      <path d="M16 3 L29 27 L3 27 Z" fill="url(#cent-gradient)" />
    </svg>
  );
}
