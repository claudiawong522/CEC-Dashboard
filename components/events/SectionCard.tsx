import { DoneCheckbox } from "@/components/events/DoneCheckbox";

// Mirrors design/BRAND_KIT.md's fixed section colours, keyed by the lowercase
// `section` prop each *Section.tsx passes to SectionCard.
const SECTION_TINTS: Record<string, string> = {
  venue: "var(--teal)",
  attendees: "var(--teal)",
  media: "var(--teal)",
  speaker: "var(--coral)",
  marketing: "var(--coral)",
  money: "var(--blue)",
  food: "var(--amber)",
};

export function SectionCard({
  title,
  eventId,
  section,
  done,
  hideDone,
  children,
}: {
  title: string;
  eventId: string;
  section: string;
  done: boolean;
  hideDone?: boolean;
  children: React.ReactNode;
}) {
  const tint = SECTION_TINTS[section];

  // The section colour shows as a flat 3px top bar and a small swatch by the
  // title, not a wash over the card.
  return (
    <div
      className="min-h-[352px] border border-line border-t-[3px] bg-background px-[22px] py-5 shadow-soft"
      style={{ borderTopColor: tint ?? "var(--black)" }}
    >
      <div className="flex animate-fadeUp flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5 font-display text-[18px] font-bold text-foreground">
            {tint && (
              <span
                aria-hidden="true"
                className="size-3 shrink-0 border-2 border-foreground"
                style={{ background: tint }}
              />
            )}
            {title}
          </span>
          {!hideDone && (
            <DoneCheckbox eventId={eventId} section={section} initialDone={done} />
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
