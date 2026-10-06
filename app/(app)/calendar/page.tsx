import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/calendar/CalendarView";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendar"
        actions={
          <>
            {/* The walk-in sign in, one click from the page everyone lands on.
                A new tab because this is the screen that gets handed to a
                kiosk or thrown on a projector, and losing the calendar behind
                it is not what anyone wanted. */}
            <Button
              variant="outline"
              render={<Link href="/checkin" target="_blank" rel="noopener noreferrer" />}
              nativeButton={false}
            >
              <QrCode data-icon="inline-start" />
              Check-in page
            </Button>
            <Button render={<Link href="/events/new" />} nativeButton={false}>
              <Plus data-icon="inline-start" />
              New event
            </Button>
          </>
        }
      />

      <CalendarView events={events ?? []} />
    </div>
  );
}
