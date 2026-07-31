const MARKS = Array.from({ length: 60 }, (_, i) => (i % 2 === 0 ? "diamond" : "dot"));

/**
 * The divider between the sidebar and the main content — not a hairline,
 * the wash itself is the seam. Runs --paper (sidebar's white) through
 * --canvas (beige) into --page (main's own background) so both edges
 * blend into their neighbor instead of cutting a line against it.
 */
export function SidebarSeam() {
  return (
    <div
      aria-hidden="true"
      className="relative z-[1] w-[26px] shrink-0 overflow-hidden"
      style={{
        background:
          "linear-gradient(90deg, var(--paper) 0%, var(--canvas) 50%, var(--page) 100%)",
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center gap-3 pt-3">
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
