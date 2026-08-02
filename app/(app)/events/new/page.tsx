import Link from "next/link";
import { ToggleForm } from "@/components/events/ToggleForm";
import { Sticker } from "@/components/stickers/Sticker";
import { StarPolygon } from "@/components/stickers/shapes";
import { createClient } from "@/lib/supabase/server";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ media?: string; date?: string; ideaId?: string }>;
}) {
  const { media, date, ideaId } = await searchParams;

  let ideaPitch: string | null = null;
  if (ideaId) {
    const supabase = await createClient();
    const { data: idea } = await supabase
      .from("external_ideas")
      .select("pitch")
      .eq("id", ideaId)
      .maybeSingle<{ pitch: string }>();
    ideaPitch = idea?.pitch ?? null;
  }

  return (
    <div className="relative flex flex-col gap-[19px]">
      <Sticker
        floatVariant="float2"
        floatDuration="15s"
        wrapperClassName="pointer-events-none absolute -top-4 right-[6%] z-0"
        className="pointer-events-auto opacity-[0.35]"
      >
        <StarPolygon size={70} />
      </Sticker>
      <Link
        href="/calendar"
        className="relative z-10 w-fit font-mono text-[10.5px] tracking-[0.08em] text-faint uppercase transition-colors duration-200 ease-brand hover:text-ink"
      >
        ← Calendar
      </Link>
      <div className="flex flex-col gap-[5px]">
        <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          New event
        </h1>
        <p className="font-mono text-[10px] tracking-[0.14em] text-faint uppercase">
          Step 1 of 2
        </p>
      </div>
      {ideaId && ideaPitch && (
        <p className="relative z-10 font-sans text-[12.5px] text-body">
          Converting from External: <span className="font-medium text-ink">{ideaPitch}</span>
        </p>
      )}
      <ToggleForm defaultMediaOn={media === "1"} defaultDate={date} defaultName={ideaPitch ?? undefined} ideaId={ideaId} />
    </div>
  );
}
