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

  return (
    <div
      className="min-h-[352px] rounded-card border border-[rgba(35,32,28,0.1)] px-[22px] py-5"
      style={
        {
          "--input-ground": "var(--page)",
          background: tint
            ? `radial-gradient(ellipse 900px 520px at 100% -12%, color-mix(in srgb, ${tint} 7%, transparent), transparent 60%), var(--paper)`
            : "var(--paper)",
        } as React.CSSProperties
      }
    >
      <div className="flex animate-fadeUp flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-sans text-[19px] leading-[1.25] tracking-[-0.014em] text-ink">
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
