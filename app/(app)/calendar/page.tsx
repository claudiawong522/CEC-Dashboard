import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/calendar/CalendarView";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, event_date, event_time, event_end_time, venue, is_complete")
    .order("event_date", { ascending: true });

  if (error) console.error("[calendar] failed to load events:", error.message);

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-[32px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          Calendar
        </h1>
        <Button
          render={<Link href="/events/new" />}
          nativeButton={false}
          className="gap-2 rounded-btn px-5 py-3 text-[15px] font-medium"
        >
          <Plus className="size-4" />
          New event
        </Button>
      </div>

      <CalendarView events={events ?? []} />
    </div>
  );
}
