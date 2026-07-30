"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { SECTION_COLORS, type SectionLabel } from "@/lib/utils/section-colors";
import { Sticker } from "@/components/stickers/Sticker";
import { Sprig, Confetti } from "@/components/stickers/shapes";
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

  const tabs: { key: TabKey; label: SectionLabel | "Notes"; done: boolean }[] = [
    { key: "venue", label: "Venue", done: event.venue_done },
    ...(event.has_speaker
      ? [{ key: "speaker" as const, label: "Speaker" as const, done: speaker?.done ?? false }]
      : []),
    ...(event.has_attendees
      ? [{ key: "attendees" as const, label: "Attendees" as const, done: attendees?.done ?? false }]
      : []),
    ...(event.has_money
      ? [{ key: "money" as const, label: "Money" as const, done: money?.done ?? false }]
      : []),
    ...(event.has_food
      ? [{ key: "food" as const, label: "Food" as const, done: food?.done ?? false }]
      : []),
    ...(event.has_marketing
      ? [{ key: "marketing" as const, label: "Marketing" as const, done: marketing?.done ?? false }]
      : []),
    ...(event.has_media
      ? [{ key: "media" as const, label: "Media" as const, done: event.media_done }]
      : []),
    ...(event.has_recurring
      ? [{ key: "recurring" as const, label: "Recurring" as const, done: recurring?.done ?? false }]
      : []),
    { key: "notes", label: "Notes", done: false },
  ];

  const doneable = tabs.filter((t) => t.key !== "notes");
  const doneCount = doneable.filter((t) => t.done).length;
  const activeIndex = tabs.findIndex((t) => t.key === activeTab);

  return (
    <div className="flex max-w-[1180px] flex-col gap-[19px]">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] tracking-[0.14em] text-faint uppercase">
          Step 2 of 2
        </span>
        <span
          className="relative overflow-hidden rounded-[20px] px-2.5 py-1 font-mono text-[9.5px] tracking-[0.1em] text-ink uppercase"
          style={{
            background:
              "linear-gradient(95deg, rgba(232,88,61,.2), rgba(224,185,74,.2), rgba(63,167,137,.2), rgba(59,111,194,.2))",
          }}
        >
          {doneCount} of {doneable.length} done
          {doneCount === doneable.length && (
            <Confetti
              size={28}
              className="pointer-events-none absolute -top-1.5 -right-1.5 opacity-90"
            />
          )}
        </span>
      </div>

      <div
        className="relative flex items-end gap-3 overflow-hidden rounded-card border border-[rgba(35,32,28,0.1)] bg-paper px-5 py-[19px]"
        style={{ "--input-ground": "var(--page)" } as React.CSSProperties}
      >
        <Sticker
          floatVariant="float3"
          floatDuration="14s"
          wrapperClassName="pointer-events-none absolute top-1 right-[110px] z-0"
          className="pointer-events-none opacity-[0.85]"
        >
          <Sprig size={62} />
        </Sticker>

        <div className="flex flex-[2] flex-col gap-1.5">
          <Label className="font-sans text-[12px] font-normal text-body">Event name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label className="font-sans text-[12px] font-normal text-body">Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label className="font-sans text-[12px] font-normal text-body">Start</Label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label className="font-sans text-[12px] font-normal text-body">End</Label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <Button
          variant="outline"
          className="px-[18px] py-2.5 text-[13px]"
          disabled={!dirty || isPending}
          onClick={handleSaveHeader}
        >
          Save
        </Button>
      </div>

      <div className="flex gap-6">
        <nav className="relative flex w-[184px] shrink-0 flex-col">
          <div
            className="absolute inset-x-0 h-9 rounded-btn transition-[top] duration-[340ms] ease-indicator"
            style={{
              top: activeIndex * 36,
              background:
                "linear-gradient(95deg, rgba(232,88,61,.15), rgba(224,185,74,.15), rgba(63,167,137,.15), rgba(59,111,194,.15))",
            }}
          />
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className="relative flex h-9 items-center gap-[9px] px-[13px] font-sans text-[13px] text-body transition-colors duration-200 hover:text-ink"
            >
              <span
                className="inline-block h-2 w-[9px] shrink-0"
                style={{
                  background: tab.label === "Notes" ? "var(--amber)" : SECTION_COLORS[tab.label],
                  clipPath: "polygon(50% 0,100% 100%,0 100%)",
                }}
              />
              {tab.label}
              {tab.key !== "notes" && (
                <span
                  className="ml-auto size-1.5 rounded-full bg-teal transition-opacity duration-300"
                  style={{ opacity: tab.done ? 1 : 0 }}
                />
              )}
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
