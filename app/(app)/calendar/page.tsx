import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/calendar/CalendarView";
import { Button } from "@/components/ui/button";
import { Plus, QrCode } from "lucide-react";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, name, event_date, event_end_date, all_day, event_time, event_end_time, venue, is_complete, has_speaker, has_attendees, has_money, has_food, has_marketing, has_media, has_recurring",
    )
    .order("event_date", { ascending: true });

  if (error) console.error("[calendar] failed to load events:", error.message);

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-[25px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          Calendar
        </h1>
        <div className="flex items-center gap-2">
          {/* The walk-in sign in, one click from the page everyone lands on.
              A new tab because this is the screen that gets handed to a
              kiosk or thrown on a projector, and losing the calendar behind
              it is not what anyone wanted. */}
          <Button
            variant="outline"
            render={<Link href="/checkin" target="_blank" rel="noopener noreferrer" />}
            nativeButton={false}
            className="gap-2 rounded-btn px-[18px] py-[10px] text-[13px] font-medium"
          >
            <QrCode className="size-4" />
            Check-in page
          </Button>
          <Button
            render={<Link href="/events/new" />}
            nativeButton={false}
            className="gap-2 rounded-btn px-[18px] py-[10px] text-[13px] font-medium"
          >
            <Plus className="size-4" />
            New event
          </Button>
        </div>
      </div>

      <CalendarView events={events ?? []} />
    </div>
  );
}
