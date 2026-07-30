/**
 * Sticker shapes — pure CSS, no bitmaps, per design/BRAND_KIT.md § Sticker
 * library. Reproduces the kit's reference swatches (design/CEC Brand
 * Kit.dc.html §06) at their documented sizes/colours; each accepts a `size`
 * multiplier so screens can place the same shape at different scales.
 * Hover micro-transitions match the kit's `style-hover` attributes; wrap in
 * `<Sticker>` for the click-pop + ambient drift on top of these.
 */

import { cn } from "@/lib/utils";

export function Flower({
  size = 78,
  petal = "var(--coral)",
  center = "var(--amber)",
  className,
}: {
  size?: number;
  petal?: string;
  center?: string;
  className?: string;
}) {
  const s = size / 78;
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      {[0, 72, 144, 216, 288].map((deg) => (
        <div
          key={deg}
          className="absolute rounded-full blur-[8px]"
          style={{
            top: 2 * s,
            left: 24 * s,
            width: 30 * s,
            height: 42 * s,
            background: `radial-gradient(circle at 50% 64%, ${petal}, rgba(232,88,61,.28) 60%, transparent 76%)`,
            transformOrigin: "50% 96%",
            transform: `rotate(${deg}deg)`,
          }}
        />
      ))}
      <div
        className="absolute rounded-full blur-[2px]"
        style={{ top: 33 * s, left: 33 * s, width: 11 * s, height: 11 * s, background: center }}
      />
    </div>
  );
}

/** The kit's 10-point polygon — used both as "star · pinned" (functional,
 * full strength) and Login's S2 "sparkle" (decorative, dimmer/smaller). */
export function StarPolygon({
  size = 40,
  from = "var(--amber)",
  to = "var(--coral)",
  className,
}: {
  size?: number;
  from?: string;
  to?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("transition-transform duration-500 ease-brand hover:rotate-[72deg] hover:scale-110", className)}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(140deg, ${from}, ${to})`,
        clipPath:
          "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 92%,50% 70%,21% 92%,32% 57%,2% 35%,39% 35%)",
      }}
    />
  );
}

export function TwinkleDiamondPair({
  size = 46,
  primary = "var(--blue)",
  secondary = "var(--amber)",
  className,
}: {
  size?: number;
  primary?: string;
  secondary?: string;
  className?: string;
}) {
  const s = size / 46;
  const diamond = "polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)";
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <div
        className="absolute"
        style={{
          left: 8 * s,
          top: 2 * s,
          width: 29 * s,
          height: 42 * s,
          background: primary,
          clipPath: diamond,
          animation: "twinkle 2.6s ease-in-out infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          left: 29 * s,
          top: 25 * s,
          width: 16 * s,
          height: 21 * s,
          background: secondary,
          clipPath: diamond,
          animation: "twinkle 2.6s ease-in-out infinite",
          animationDelay: "0.6s",
        }}
      />
    </div>
  );
}

export function CrescentMoon({
  size = 32,
  className,
  groundColor = "var(--page)",
}: {
  size?: number;
  className?: string;
  groundColor?: string;
}) {
  const s = size / 32;
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 35%, var(--amber), rgba(224,185,74,.5) 75%)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{ top: -3 * s, left: 9 * s, width: 29 * s, height: 29 * s, background: groundColor }}
      />
    </div>
  );
}

export function BeadRow({
  size = 9,
  gap = 3,
  className,
}: {
  size?: number;
  gap?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("group/beads flex items-center transition-[gap] duration-[400ms]", className)}
      style={{ gap }}
    >
      {["var(--coral)", "var(--amber)", "var(--teal)", "var(--blue)"].map((c) => (
        <span
          key={c}
          className="rounded-full transition-[margin] duration-[400ms] group-hover/beads:mx-[3px]"
          style={{ width: size, height: size, background: c }}
        />
      ))}
    </div>
  );
}

export function Sprig({ size = 66, className }: { size?: number; className?: string }) {
  const s = size / 66;
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <div
        className="absolute"
        style={{
          top: 14 * s,
          left: 32 * s,
          width: 1.5 * s,
          height: 46 * s,
          background: "linear-gradient(180deg, rgba(63,167,137,.65), rgba(63,167,137,.06))",
        }}
      />
      <div
        className="absolute rounded-full blur-[5px]"
        style={{
          top: 20 * s,
          left: 12 * s,
          width: 22 * s,
          height: 12 * s,
          background: "radial-gradient(circle at 70% 50%, var(--teal), transparent 74%)",
          transform: "rotate(-18deg)",
        }}
      />
      <div
        className="absolute rounded-full blur-[5px]"
        style={{
          top: 32 * s,
          left: 31 * s,
          width: 22 * s,
          height: 12 * s,
          background: "radial-gradient(circle at 30% 50%, var(--teal), transparent 74%)",
          transform: "rotate(18deg)",
        }}
      />
      <div
        className="absolute blur-[4px]"
        style={{
          top: 2 * s,
          left: 26 * s,
          width: 13 * s,
          height: 16 * s,
          background: "radial-gradient(circle at 50% 70%, var(--coral), transparent 76%)",
          borderRadius: "50% 50% 45% 45%",
        }}
      />
    </div>
  );
}

/** Reserve — heart · favourite */
export function Heart({ size = 44, className }: { size?: number; className?: string }) {
  const s = size / 44;
  const glow = "radial-gradient(circle at 40% 35%, var(--coral-bloom), var(--coral) 70%)";
  return (
    <div
      className={cn("transition-transform duration-[400ms] ease-spring hover:scale-[1.18]", className)}
      style={{ position: "relative", width: size, height: size }}
    >
      <div
        className="absolute rounded-full blur-[2px]"
        style={{ left: 7 * s, top: 6 * s, width: 25 * s, height: 25 * s, background: glow }}
      />
      <div
        className="absolute rounded-full blur-[2px]"
        style={{ left: 19 * s, top: 6 * s, width: 25 * s, height: 25 * s, background: glow }}
      />
      <div
        className="absolute blur-[2px]"
        style={{
          left: 11 * s,
          top: 15 * s,
          width: 25 * s,
          height: 25 * s,
          background: "var(--coral)",
          clipPath: "polygon(0 0,100% 0,50% 100%)",
        }}
      />
    </div>
  );
}

/** Reserve — sparkle · new (near-identical to the login mark's S3, sized to the kit's own reserve swatch) */
export function Sparkle({ size = 46, className }: { size?: number; className?: string }) {
  return <TwinkleDiamondPair size={size} className={className} />;
}

/** Reserve — cherries · food */
export function Cherries({ size = 44, className }: { size?: number; className?: string }) {
  const s = size / 44;
  return (
    <div
      className={cn("transition-transform duration-500 ease-brand hover:rotate-[8deg]", className)}
      style={{ position: "relative", width: size, height: size }}
    >
      <div
        className="absolute"
        style={{
          left: 17 * s,
          top: 2 * s,
          width: 15 * s,
          height: 15 * s,
          borderLeft: `${2 * s}px solid var(--teal)`,
          borderBottom: `${2 * s}px solid var(--teal)`,
          borderRadius: `0 0 0 ${14 * s}px`,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          left: 5 * s,
          top: 21 * s,
          width: 18 * s,
          height: 18 * s,
          background: "radial-gradient(circle at 38% 34%, var(--coral-bloom), var(--coral) 72%)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          left: 23 * s,
          top: 25 * s,
          width: 15 * s,
          height: 15 * s,
          background: "radial-gradient(circle at 38% 34%, var(--coral-bloom), #D8492F 72%)",
        }}
      />
    </div>
  );
}

/** Reserve — bow · social */
export function Bow({ size = 50, className }: { size?: number; className?: string }) {
  const s = size / 50;
  const h = 32 * s;
  return (
    <div
      className={cn("transition-transform duration-[450ms] ease-spring hover:scale-[1.14]", className)}
      style={{ position: "relative", width: size, height: h }}
    >
      <div
        className="absolute rounded-[4px]"
        style={{
          left: 0,
          top: 4 * s,
          width: 21 * s,
          height: 23 * s,
          background: "linear-gradient(140deg, var(--coral-bloom), var(--coral))",
          clipPath: "polygon(100% 0,100% 100%,0 78%,0 22%)",
        }}
      />
      <div
        className="absolute rounded-[4px]"
        style={{
          right: 0,
          top: 4 * s,
          width: 21 * s,
          height: 23 * s,
          background: "linear-gradient(220deg, var(--coral-bloom), var(--coral))",
          clipPath: "polygon(0 0,0 100%,100% 78%,100% 22%)",
        }}
      />
      <div
        className="absolute rounded-[4px]"
        style={{ left: 20 * s, top: 9 * s, width: 10 * s, height: 13 * s, background: "var(--amber)" }}
      />
    </div>
  );
}

/** Functional — confetti · complete (all-sections-done banner) */
export function Confetti({ size = 80, className }: { size?: number; className?: string }) {
  const s = size / 80;
  const dots = [
    { left: 10, top: 16, size: 8, color: "var(--coral)" },
    { left: 34, top: 8, size: 6, color: "var(--amber)" },
    { left: 58, top: 24, size: 9, color: "var(--teal)" },
    { left: 22, top: 48, size: 7, color: "var(--blue)" },
    { left: 50, top: 58, size: 6, color: "var(--coral)" },
    { left: 38, top: 32, size: 5, color: "var(--amber)" },
  ];
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      {dots.map((d, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-[1px]"
          style={{ left: d.left * s, top: d.top * s, width: d.size * s, height: d.size * s, background: d.color }}
        />
      ))}
    </div>
  );
}

/** Functional — seal · archive (Past Events term filters reuse this shape) */
export function Seal({
  label,
  size = 44,
  color = "var(--coral)",
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
        "flex items-center justify-center rounded-input border text-center font-mono text-[9px] font-medium tracking-[0.1em] uppercase transition-[background-color,transform] duration-300 ease-brand hover:rotate-[-6deg]",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderColor: `color-mix(in srgb, ${color} 55%, transparent)`,
        color,
        backgroundColor: active ? `color-mix(in srgb, ${color} 8%, transparent)` : undefined,
        lineHeight: 1.25,
      }}
    >
      {label}
    </div>
  );
}

/** Decorative — cloud wash used as a small blurred blob (headers, empty corners) */
export function CloudPuff({ size = 84, className }: { size?: number; className?: string }) {
  const s = size / 84;
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <div
        className="absolute rounded-full blur-[11px]"
        style={{
          left: 16 * s,
          top: 20 * s,
          width: 52 * s,
          height: 32 * s,
          background: "radial-gradient(circle at 30% 50%, var(--blue), transparent 72%)",
        }}
      />
      <div
        className="absolute rounded-full blur-[11px]"
        style={{
          left: 24 * s,
          top: 38 * s,
          width: 52 * s,
          height: 28 * s,
          background: "radial-gradient(circle at 70% 50%, var(--teal), transparent 72%)",
        }}
      />
      <div
        className="absolute rounded-full blur-[11px]"
        style={{
          left: 20 * s,
          top: 12 * s,
          width: 42 * s,
          height: 24 * s,
          background: "radial-gradient(circle at 50% 50%, rgba(232,88,61,.85), transparent 72%)",
        }}
      />
    </div>
  );
}

/** Decorative — highlighter bar, used loose (not over text) as a background accent */
export function HighlighterBar({
  width = 72,
  height = 22,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-full blur-[3px] transition-[width] duration-500 ease-brand hover:w-[52px]", className)}
      style={{
        width,
        height,
        background:
          "linear-gradient(95deg, rgba(232,88,61,.35), rgba(224,185,74,.35), rgba(63,167,137,.35), rgba(59,111,194,.35))",
      }}
    />
  );
}
