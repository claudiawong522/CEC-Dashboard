import Link from "next/link";
import { ToggleForm } from "@/components/events/ToggleForm";
import { TriangleScatter } from "@/components/decor/shapes";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="relative flex flex-col gap-6">
      <TriangleScatter count={4} seed={51} opacity={0.2} className="z-0 h-48" />
      <Link
        href="/calendar"
        className="t-eyebrow relative z-10 w-fit text-foreground/50 transition-colors duration-200 ease-fluid hover:text-foreground"
      >
        ← Calendar
      </Link>
      <PageHeader eyebrow="Step 1 of 2" title="New event" className="relative z-10" />
      {ideaId && ideaPitch && (
        <p className="relative z-10 font-sans text-[13px] text-subtle">
          Converting from External: <span className="font-medium text-foreground">{ideaPitch}</span>
        </p>
      )}
      <ToggleForm defaultMediaOn={media === "1"} defaultDate={date} defaultName={ideaPitch ?? undefined} ideaId={ideaId} />
    </div>
  );
}
