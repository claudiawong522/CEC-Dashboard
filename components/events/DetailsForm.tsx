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
import { cn } from "@/lib/utils";
import type {
  EventRow,
  SpeakerRow,
  AttendeesRow,
  MoneyRow,
  FoodRow,
  MarketingRow,
  MarketingCustomItemRow,
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

type TabKey =
  | "venue"
  | "speaker"
  | "attendees"
  | "money"
  | "food"
  | "marketing"
  | "media"
  | "recurring"
  | "notes";

export function DetailsForm({
  event,
  speaker,
  attendees,
  money,
  food,
  marketing,
  recurring,
  files,
  marketingCustomItems,
}: {
  event: EventRow;
  speaker: SpeakerRow | null;
  attendees: AttendeesRow | null;
  money: MoneyRow | null;
  food: FoodRow | null;
  marketing: MarketingRow | null;
  recurring: RecurringRow | null;
  files: EventFileRow[];
  marketingCustomItems: MarketingCustomItemRow[];
}) {
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState(event.event_date);
  const [startTime, setStartTime] = useState(event.event_time.slice(0, 5));
  const [endTime, setEndTime] = useState(event.event_end_time?.slice(0, 5) ?? "");
  const [isPending, startTransition] = useTransition();
  const dirty =
    name !== event.name ||
    date !== event.event_date ||
    startTime !== event.event_time.slice(0, 5) ||
    endTime !== (event.event_end_time?.slice(0, 5) ?? "");

  // Land straight on the Recurring tab right after creating a recurring
  // event — that's the one step that still needs action before anything
  // else here is useful.
  const defaultTab: TabKey = event.has_recurring && !event.recurring_series_id ? "recurring" : "venue";
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);

  function handleSaveHeader() {
    startTransition(async () => {
      try {
        await updateEventHeader(event.id, {
          name,
          eventDate: date,
          eventStartTime: startTime,
          eventEndTime: endTime,
        });
        toast.success("Saved");
      } catch {
        toast.error("Couldn't save");
      }
    });
  }

  const tabs: { key: TabKey; label: string; done: boolean }[] = [
    { key: "venue", label: "Venue", done: event.venue_done },
    ...(event.has_speaker
      ? [{ key: "speaker" as const, label: "Speaker", done: speaker?.done ?? false }]
      : []),
    ...(event.has_attendees
      ? [{ key: "attendees" as const, label: "Attendees", done: attendees?.done ?? false }]
      : []),
    ...(event.has_money ? [{ key: "money" as const, label: "Money", done: money?.done ?? false }] : []),
    ...(event.has_food ? [{ key: "food" as const, label: "Food", done: food?.done ?? false }] : []),
    ...(event.has_marketing
      ? [{ key: "marketing" as const, label: "Marketing", done: marketing?.done ?? false }]
      : []),
    ...(event.has_media
      ? [{ key: "media" as const, label: "Media", done: event.media_done }]
      : []),
    ...(event.has_recurring
      ? [{ key: "recurring" as const, label: "Recurring", done: recurring?.done ?? false }]
      : []),
    { key: "notes", label: "Notes", done: false },
  ];

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Step 2 of 2</p>
        {event.is_complete && <Badge variant="secondary">Complete</Badge>}
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-stone-200 p-4">
        <div className="flex flex-col gap-1.5">
          <Label>Event name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Start time</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>End time</Label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
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

      <div className="flex gap-6">
        <nav className="flex w-40 shrink-0 flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                activeTab === tab.key
                  ? "bg-stone-100 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-stone-50 hover:text-foreground",
              )}
            >
              {tab.label}
              {tab.done && <span className="size-1.5 rounded-full bg-emerald-500" />}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {activeTab === "venue" && (
            <VenueSection
              eventId={event.id}
              venue={event.venue}
              done={event.venue_done}
              files={filesFor(files, "venue")}
            />
          )}

          {activeTab === "speaker" && event.has_speaker && (
            <SpeakerSection
              eventId={event.id}
              description={speaker?.description ?? null}
              done={speaker?.done ?? false}
              portraitFiles={filesFor(files, "speaker_portrait")}
            />
          )}

          {activeTab === "attendees" && event.has_attendees && (
            <AttendeesSection
              eventId={event.id}
              lumaUrl={attendees?.luma_url ?? null}
              headcountNotes={attendees?.headcount_notes ?? null}
              done={attendees?.done ?? false}
              files={filesFor(files, "attendees")}
            />
          )}

          {activeTab === "money" && event.has_money && (
            <MoneySection
              eventId={event.id}
              budgetedAmount={money?.budgeted_amount ?? null}
              actualAmount={money?.actual_amount ?? null}
              notes={money?.notes ?? null}
              done={money?.done ?? false}
              files={filesFor(files, "money")}
            />
          )}

          {activeTab === "food" && event.has_food && (
            <FoodSection
              eventId={event.id}
              usualOptions={food?.usual_options ?? null}
              halalEnabled={food?.halal_enabled ?? false}
              halalOptions={food?.halal_options ?? null}
              done={food?.done ?? false}
              files={filesFor(files, "food")}
            />
          )}

          {activeTab === "marketing" && event.has_marketing && (
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
              customItems={marketingCustomItems}
              files={filesFor(files, "marketing")}
            />
          )}

          {activeTab === "media" && event.has_media && (
            <MediaSection eventId={event.id} done={event.media_done} files={filesFor(files, "media")} />
          )}

          {activeTab === "recurring" && event.has_recurring && (
            <RecurringSection
              eventId={event.id}
              done={recurring?.done ?? false}
              alreadyLinked={!!event.recurring_series_id}
              files={filesFor(files, "recurring")}
            />
          )}

          {activeTab === "notes" && <NotesField eventId={event.id} notes={event.notes} />}
        </div>
      </div>
    </div>
  );
}
