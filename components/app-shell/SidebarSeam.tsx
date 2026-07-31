const MARKS = Array.from({ length: 60 }, (_, i) => (i % 2 === 0 ? "diamond" : "dot"));

/**
 * Overlay, not a background — the wrapping panel in AppShell.tsx paints one
 * continuous gradient under both this strip and main, so there's no seam of
 * its own to blend. This just fades --paper in over the left edge (so the
 * sidebar's flat white eases into that shared gradient) and lays a fine lace
 * of small coral marks on top.
 */
export function SidebarSeam() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[70px] overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, var(--paper) 0%, transparent 75%)" }}
      />
      <div className="absolute inset-y-0 left-0 flex w-[26px] flex-col items-center gap-3 pt-3">
        {MARKS.map((shape, i) =>
          shape === "diamond" ? (
            <div
              key={i}
              className="size-[5px] shrink-0 bg-coral/70"
              style={{
                clipPath: "polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)",
              }}
            />
          ) : (
            <div key={i} className="size-[3px] shrink-0 rounded-full bg-coral/70" />
          ),
        )}
      </div>
    </div>
  );
}
