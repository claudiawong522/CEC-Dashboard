import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/calendar/CalendarView";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, name, event_date, event_time, venue, is_complete")
    .order("event_date", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium tracking-tight">Calendar</h1>
        <Button
          render={<Link href="/events/new" />}
          size="sm"
          className="gap-1.5"
        >
          <Plus className="size-4" />
          New Event
        </Button>
      </div>

      <CalendarView events={events ?? []} />
    </div>
  );
}
