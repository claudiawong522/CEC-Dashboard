"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateEventHeader } from "@/lib/actions/events";
import { NotesField } from "@/components/events/NotesField";
import { VenueSection } from "@/components/events/sections/VenueSection";
import { SpeakerSection } from "@/components/events/sections/SpeakerSection";
import { AttendeesSection } from "@/components/events/sections/AttendeesSection";
import { MoneySection } from "@/components/events/sections/MoneySection";
import { FoodSection } from "@/components/events/sections/FoodSection";
import { MarketingSection } from "@/components/events/sections/MarketingSection";
import { MediaSection } from "@/components/events/sections/MediaSection";
import { RecurringSection } from "@/components/events/sections/RecurringSection";
import type {
  EventRow,
  SpeakerRow,
  AttendeesRow,
  MoneyRow,
  FoodRow,
  MarketingRow,
  RecurringRow,
  EventFileRow,
} from "@/lib/types/events";

function filesFor(files: EventFileRow[], section: string) {
  return files
    .filter((f) => f.section === section)
    .map((f) => ({
      id: f.id,
      bucket: f.bucket,
      storage_path: f.storage_path,
      file_name: f.file_name,
      mime_type: f.mime_type,
    }));
}

export function DetailsForm({
  event,
  speaker,
  attendees,
  money,
  food,
  marketing,
  recurring,
  files,
}: {
  event: EventRow;
  speaker: SpeakerRow | null;
  attendees: AttendeesRow | null;
  money: MoneyRow | null;
  food: FoodRow | null;
  marketing: MarketingRow | null;
  recurring: RecurringRow | null;
  files: EventFileRow[];
}) {
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState(event.event_date);
  const [time, setTime] = useState(event.event_time.slice(0, 5));
  const [isPending, startTransition] = useTransition();
  const dirty = name !== event.name || date !== event.event_date || time !== event.event_time.slice(0, 5);

  function handleSaveHeader() {
    startTransition(async () => {
      try {
        await updateEventHeader(event.id, { name, eventDate: date, eventTime: time });
        toast.success("Saved");
      } catch {
        toast.error("Couldn't save");
      }
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Step 2 of 2</p>
          {event.is_complete && <Badge variant="secondary">Complete</Badge>}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-stone-200 p-4">
        <div className="flex flex-col gap-1.5">
          <Label>Event name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Time</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="self-start"
          disabled={!dirty || isPending}
          onClick={handleSaveHeader}
        >
          Save
        </Button>
      </div>

      <VenueSection
        eventId={event.id}
        venue={event.venue}
        done={event.venue_done}
        files={filesFor(files, "venue")}
      />

      {event.has_speaker && (
        <SpeakerSection
          eventId={event.id}
          description={speaker?.description ?? null}
          done={speaker?.done ?? false}
          evidenceFiles={filesFor(files, "speaker")}
          portraitFiles={filesFor(files, "speaker_portrait")}
        />
      )}

      {event.has_attendees && (
        <AttendeesSection
          eventId={event.id}
          lumaUrl={attendees?.luma_url ?? null}
          headcountNotes={attendees?.headcount_notes ?? null}
          done={attendees?.done ?? false}
          files={filesFor(files, "attendees")}
        />
      )}

      {event.has_money && (
        <MoneySection
          eventId={event.id}
          budgetedAmount={money?.budgeted_amount ?? null}
          actualAmount={money?.actual_amount ?? null}
          notes={money?.notes ?? null}
          done={money?.done ?? false}
          files={filesFor(files, "money")}
        />
      )}

      {event.has_food && (
        <FoodSection
          eventId={event.id}
          usualOptions={food?.usual_options ?? null}
          halalEnabled={food?.halal_enabled ?? false}
          halalOptions={food?.halal_options ?? null}
          done={food?.done ?? false}
          files={filesFor(files, "food")}
        />
      )}

      {event.has_marketing && (
        <MarketingSection
          eventId={event.id}
          done={marketing?.done ?? false}
          values={{
            instagramPost: marketing?.instagram_post ?? false,
            eshipListserve: marketing?.eship_listserve ?? false,
            storyShoutout1: marketing?.story_shoutout_1 ?? false,
            storyShoutout2: marketing?.story_shoutout_2 ?? false,
            storyShoutout3: marketing?.story_shoutout_3 ?? false,
            posters: marketing?.posters ?? false,
            reel: marketing?.reel ?? false,
          }}
          files={filesFor(files, "marketing")}
        />
      )}

      {event.has_media && (
        <MediaSection eventId={event.id} done={event.media_done} files={filesFor(files, "media")} />
      )}

      {event.has_recurring && (
        <RecurringSection
          eventId={event.id}
          done={recurring?.done ?? false}
          alreadyLinked={!!event.recurring_series_id}
          files={filesFor(files, "recurring")}
        />
      )}

      <NotesField eventId={event.id} notes={event.notes} />
    </div>
  );
}
