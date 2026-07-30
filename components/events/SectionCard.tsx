import { DoneCheckbox } from "@/components/events/DoneCheckbox";

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
  return (
    <div
      className="min-h-[352px] rounded-card border border-[rgba(35,32,28,0.1)] bg-paper px-[22px] py-5"
      style={{ "--input-ground": "var(--page)" } as React.CSSProperties}
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
