export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient
          id="cent-gradient"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="32"
          x2="32"
          y2="0"
        >
          <stop offset="0%" stopColor="var(--coral)" />
          <stop offset="35%" stopColor="var(--amber)" />
          <stop offset="65%" stopColor="var(--teal)" />
          <stop offset="100%" stopColor="var(--blue)" />
        </linearGradient>
      </defs>
      <path d="M16 3 L29 27 L3 27 Z" fill="url(#cent-gradient)" />
    </svg>
  );
}
