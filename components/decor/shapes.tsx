/**
 * Decor, v2. The only ornament cornellec.com uses is its own logo exploded
 * into flat pastel triangles, a short mint rule, and a marquee strip. These
 * are those, as CSS. Wrap a shape in <Sticker> for drift and click-pop.
 * See design/BRAND_KIT.md § Decor.
 */

import { cn } from "@/lib/utils";
import { Sticker } from "@/components/decor/Sticker";

/** The logo's own tile colours (components/app-shell/BrandMark.tsx). */
export const TILE_COLORS = [
  "#F7DC6F",
  "#E8B830",
  "#D95070",
  "#C43A57",
  "#40B5A0",
  "#2A9D8F",
  "#8CBF78",
  "#E06070",
] as const;

const SECTION_COLORS = ["var(--coral)", "var(--amber)", "var(--teal)", "var(--blue)"] as const;

/** One flat triangle. `flip` points it down. */
export function Tri({
  size = 24,
  color = "var(--mint)",
  flip = false,
  className,
  style,
}: {
  size?: number;
  color?: string;
  flip?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("shrink-0", className)}
      style={{
        width: size,
        height: Math.round(size * 0.88),
        background: color,
        clipPath: flip ? "polygon(0 0,100% 0,50% 100%)" : "polygon(50% 0,100% 100%,0 100%)",
        ...style,
      }}
    />
  );
}

// Small deterministic generator so the scatter is identical on the server
// and the client (a Math.random() layout would fail hydration).
function lcg(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * The site's hero ornament: a loose scatter of the logo's tiles at low
 * opacity. Positioned absolutely inside whatever `relative` box holds it,
 * behind content (`-z-10` is yours to add). Each triangle drifts and pops.
 */
export function TriangleScatter({
  count = 6,
  seed = 1,
  min = 22,
  max = 64,
  opacity = 0.22,
  className,
}: {
  count?: number;
  seed?: number;
  min?: number;
  max?: number;
  opacity?: number;
  className?: string;
}) {
  const rand = lcg(seed * 7919);
  const tris = Array.from({ length: count }, (_, i) => ({
    left: 4 + rand() * 88,
    top: 4 + rand() * 80,
    size: Math.round(min + rand() * (max - min)),
    color: TILE_COLORS[Math.floor(rand() * TILE_COLORS.length)],
    flip: rand() > 0.6,
    rotate: Math.round(rand() * 40 - 20),
    variant: (["float1", "float2", "float3"] as const)[i % 3],
    duration: `${12 + Math.round(rand() * 6)}s`,
    delay: `${Math.round(rand() * 4)}s`,
  }));
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {tris.map((t, i) => (
        <Sticker
          key={i}
          floatVariant={t.variant}
          floatDuration={t.duration}
          floatDelay={t.delay}
          wrapperClassName="absolute"
          style={{ left: `${t.left}%`, top: `${t.top}%`, opacity }}
          className="transition-transform duration-300 ease-fluid hover:scale-110"
        >
          <Tri size={t.size} color={t.color} flip={t.flip} style={{ transform: `rotate(${t.rotate}deg)` }} />
        </Sticker>
      ))}
    </div>
  );
}

/** Four small section-coloured triangles in a row. Replaces v1's BeadRow. */
export function TriRow({
  size = 8,
  gap = 4,
  className,
}: {
  size?: number;
  gap?: number;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("flex items-end", className)} style={{ gap }}>
      {SECTION_COLORS.map((c) => (
        <Tri key={c} size={size} color={c} />
      ))}
    </div>
  );
}

/** The 4px mint bar the site draws under section heads. */
export function MintRule({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("h-1 w-[120px] bg-mint", className)} />;
}

/**
 * The hero marquee: tracked uppercase words sliding left forever, faded at
 * both edges. Three copies so the -33.333% loop is seamless.
 */
export function Marquee({
  items,
  className,
}: {
  items: readonly string[];
  className?: string;
}) {
  const row = [...items, ...items, ...items];
  return (
    <div
      aria-hidden="true"
      className={cn(
        "marquee-mask w-full overflow-hidden font-display text-[14px] font-bold tracking-[0.2em] uppercase whitespace-nowrap text-mint-dark/70 md:text-[16px] motion-reduce:[&>div]:animate-none",
        className,
      )}
    >
      <div className="inline-block animate-marquee">
        {row.map((word, i) => (
          <span key={i} className="mx-3">
            {word}
            <span className="ml-6 text-mint-dark">&#9670;</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Functional: the term seal on Past Events, Attendance, Shoutouts, Coffee Chats. */
export function Seal({
  label,
  size = 44,
  color = "var(--black)",
  active = false,
  className,
}: {
  label: string;
  size?: number;
  color?: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center border-2 text-center font-display text-[10px] font-bold tracking-[0.1em] uppercase transition-[background-color,box-shadow,transform] duration-200 ease-fluid hover:-translate-y-0.5",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderColor: color,
        color,
        backgroundColor: active ? `color-mix(in srgb, ${color} 14%, transparent)` : undefined,
        boxShadow: active ? `3px 3px 0 0 ${color}` : undefined,
        lineHeight: 1.2,
      }}
    >
      {label}
    </div>
  );
}

/** A burst of small flat triangles for done states. */
export function Confetti({ size = 80, className }: { size?: number; className?: string }) {
  const s = size / 80;
  const bits = [
    { left: 8, top: 14, size: 12, color: TILE_COLORS[2], rotate: -14, flip: false },
    { left: 32, top: 4, size: 9, color: TILE_COLORS[1], rotate: 20, flip: true },
    { left: 56, top: 20, size: 14, color: TILE_COLORS[5], rotate: 8, flip: false },
    { left: 20, top: 44, size: 10, color: "var(--blue)", rotate: -30, flip: true },
    { left: 50, top: 54, size: 9, color: TILE_COLORS[3], rotate: 40, flip: false },
    { left: 36, top: 30, size: 7, color: "var(--mint)", rotate: 0, flip: false },
  ];
  return (
    <div aria-hidden="true" className={cn("relative", className)} style={{ width: size, height: size }}>
      {bits.map((b, i) => (
        <Tri
          key={i}
          size={b.size * s}
          color={b.color}
          flip={b.flip}
          className="absolute"
          style={{ left: b.left * s, top: b.top * s, transform: `rotate(${b.rotate}deg)` }}
        />
      ))}
    </div>
  );
}
