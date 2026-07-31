"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SaveIndicator } from "@/components/events/SaveIndicator";
import { DeleteEventDialog } from "@/components/events/DeleteEventDialog";
import { SectionsDialog } from "@/components/events/SectionsDialog";
import { useAutoSave } from "@/lib/hooks/use-autosave";
import {
  updateEventHeader,
  updateRecurringSeries,
  setEventSectionEnabled,
  type OptionalEventSection,
} from "@/lib/actions/events";
import { NotesField } from "@/components/events/NotesField";
import { VenueSection } from "@/components/events/sections/VenueSection";
import { SpeakerSection } from "@/components/events/sections/SpeakerSection";
import { AttendeesSection } from "@/components/events/sections/AttendeesSection";
import { MoneySection } from "@/components/events/sections/MoneySection";
import { FoodSection } from "@/components/events/sections/FoodSection";
import { MarketingSection } from "@/components/events/sections/MarketingSection";
import { MediaSection } from "@/components/events/sections/MediaSection";
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
  RecurringSeriesRow,
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
  | "notes";

export function DetailsForm({
  event,
  speaker,
  attendees,
  money,
  food,
  marketing,
  recurringSeries,
  files,
  marketingCustomItems,
}: {
  event: EventRow;
  speaker: SpeakerRow | null;
  attendees: AttendeesRow | null;
  money: MoneyRow | null;
  food: FoodRow | null;
  marketing: MarketingRow | null;
  recurringSeries: RecurringSeriesRow | null;
  files: EventFileRow[];
  marketingCustomItems: MarketingCustomItemRow[];
}) {
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState(event.event_date);
  const [endDate, setEndDate] = useState(event.event_end_date);
  const [allDay, setAllDay] = useState(event.all_day);
  const [startTime, setStartTime] = useState(event.event_time.slice(0, 5));
  const [endTime, setEndTime] = useState(event.event_end_time?.slice(0, 5) ?? "");
  const headerStatus = useAutoSave({ name, date, endDate, allDay, startTime, endTime }, (next) =>
    updateEventHeader(event.id, {
      name: next.name,
      eventDate: next.date,
      eventEndDate: next.endDate,
      allDay: next.allDay,
      eventStartTime: next.allDay ? "00:00" : next.startTime,
      eventEndTime: next.allDay ? "23:45" : next.endTime,
    }),
  );

  const [repeatsFrequency, setRepeatsFrequency] = useState(recurringSeries?.frequency ?? "weekly");
  const [repeatsEndsMode, setRepeatsEndsMode] = useState(recurringSeries?.ends_mode ?? "date");
  const [repeatsEndDate, setRepeatsEndDate] = useState(recurringSeries?.end_date ?? "");
  const [repeatsOccurrenceCount, setRepeatsOccurrenceCount] = useState(
    String(recurringSeries?.occurrence_count ?? 6),
  );
  const repeatsStatus = useAutoSave(
    { repeatsFrequency, repeatsEndsMode, repeatsEndDate, repeatsOccurrenceCount },
    (next) =>
      updateRecurringSeries(event.id, {
        frequency: next.repeatsFrequency,
        endsMode: next.repeatsEndsMode,
        endDate: next.repeatsEndsMode === "date" ? next.repeatsEndDate : undefined,
        occurrenceCount:
          next.repeatsEndsMode === "count" ? Number(next.repeatsOccurrenceCount) : undefined,
      }),
  );

  const requestedTab = useSearchParams().get("tab");
  const [activeTab, setActiveTab] = useState<TabKey>(
    requestedTab === "media" && event.has_media ? "media" : "venue",
  );

  const [sectionFlags, setSectionFlags] = useState<Record<OptionalEventSection, boolean>>({
    speaker: event.has_speaker,
    attendees: event.has_attendees,
    money: event.has_money,
    food: event.has_food,
    marketing: event.has_marketing,
    media: event.has_media,
  });
  const [, startSectionTransition] = useTransition();

  function handleToggleSection(section: OptionalEventSection, enabled: boolean) {
    setSectionFlags((prev) => ({ ...prev, [section]: enabled }));
    if (!enabled && activeTab === section) setActiveTab("venue");
    startSectionTransition(async () => {
      try {
        await setEventSectionEnabled(event.id, section, enabled);
      } catch {
        toast.error("Couldn't update section — try again");
        setSectionFlags((prev) => ({ ...prev, [section]: !enabled }));
      }
    });
  }

  const tabs: { key: TabKey; label: SectionLabel | "Notes"; done: boolean }[] = [
    { key: "venue", label: "Venue", done: event.venue_done },
    ...(sectionFlags.speaker
      ? [{ key: "speaker" as const, label: "Speaker" as const, done: speaker?.done ?? false }]
      : []),
    ...(sectionFlags.attendees
      ? [{ key: "attendees" as const, label: "Attendees" as const, done: attendees?.done ?? false }]
      : []),
    ...(sectionFlags.money
      ? [{ key: "money" as const, label: "Money" as const, done: money?.done ?? false }]
      : []),
    ...(sectionFlags.food
      ? [{ key: "food" as const, label: "Food" as const, done: food?.done ?? false }]
      : []),
    ...(sectionFlags.marketing
      ? [{ key: "marketing" as const, label: "Marketing" as const, done: marketing?.done ?? false }]
      : []),
    ...(sectionFlags.media
      ? [{ key: "media" as const, label: "Media" as const, done: event.media_done }]
      : []),
    { key: "notes", label: "Notes", done: false },
  ];

  const doneable = tabs.filter((t) => t.key !== "notes");
  const doneCount = doneable.filter((t) => t.done).length;
  const activeIndex = tabs.findIndex((t) => t.key === activeTab);

  return (
    <div className="flex max-w-[1180px] flex-col gap-[19px]">
      <div className="flex items-center justify-between gap-3">
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
        <div className="flex items-center gap-1">
          <SectionsDialog flags={sectionFlags} onToggle={handleToggleSection} />
          <DeleteEventDialog eventId={event.id} isRecurring={!!event.recurring_series_id} />
        </div>
      </div>

      <div
        className="relative flex flex-col gap-4 overflow-hidden rounded-card border border-[rgba(35,32,28,0.1)] bg-paper px-5 py-[19px]"
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

        <div className="flex items-end gap-3">
          <div className="flex flex-[2] flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">Event name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">Start date</Label>
            <DatePicker
              value={date}
              onChange={(v) => {
                setDate(v);
                if (endDate === date || !endDate) setEndDate(v);
              }}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">End date</Label>
            <DatePicker value={endDate} onChange={setEndDate} />
          </div>
          <label className="flex items-center gap-2 pb-2.5">
            <span className="font-sans text-[12px] text-body">All day</span>
            <Switch
              checked={allDay}
              onCheckedChange={(checked) => {
                setAllDay(checked);
                if (checked) {
                  setStartTime("00:00");
                  setEndTime("23:45");
                }
              }}
            />
          </label>
          <SaveIndicator status={headerStatus} className="pb-2.5" />
        </div>
        {!allDay && (
          <div className="flex items-end gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label className="font-sans text-[12px] font-normal text-body">Start time</Label>
              <TimePicker value={startTime} onChange={setStartTime} />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label className="font-sans text-[12px] font-normal text-body">End time</Label>
              <TimePicker value={endTime} onChange={setEndTime} />
            </div>
            <div className="flex-[2]" />
          </div>
        )}

        {recurringSeries && (
          <div className="flex items-end gap-3 border-t border-[rgba(35,32,28,0.07)] pt-4">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label className="font-sans text-[12px] font-normal text-body">Repeats</Label>
              <Select
                value={repeatsFrequency}
                onValueChange={(v) => setRepeatsFrequency(v as typeof repeatsFrequency)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label className="font-sans text-[12px] font-normal text-body">Ends</Label>
              <Select
                value={repeatsEndsMode}
                onValueChange={(v) => setRepeatsEndsMode(v as typeof repeatsEndsMode)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">On date</SelectItem>
                  <SelectItem value="count">After N times</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label className="font-sans text-[12px] font-normal text-body">
                {repeatsEndsMode === "date" ? "End date" : "Occurrences"}
              </Label>
              {repeatsEndsMode === "date" ? (
                <DatePicker value={repeatsEndDate} onChange={setRepeatsEndDate} />
              ) : (
                <Input
                  type="number"
                  min={1}
                  max={104}
                  value={repeatsOccurrenceCount}
                  onChange={(e) => setRepeatsOccurrenceCount(e.target.value)}
                />
              )}
            </div>
            <div className="flex-[2] font-sans text-[11.5px] text-faint">
              Changing this only affects occurrences that haven&apos;t happened yet — past ones are
              left as-is.
            </div>
            <SaveIndicator status={repeatsStatus} className="pb-2.5" />
          </div>
        )}
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

          {activeTab === "speaker" && sectionFlags.speaker && (
            <SpeakerSection
              eventId={event.id}
              description={speaker?.description ?? null}
              done={speaker?.done ?? false}
              portraitFiles={filesFor(files, "speaker_portrait")}
            />
          )}

          {activeTab === "attendees" && sectionFlags.attendees && (
            <AttendeesSection
              eventId={event.id}
              lumaUrl={attendees?.luma_url ?? null}
              headcountNotes={attendees?.headcount_notes ?? null}
              done={attendees?.done ?? false}
              files={filesFor(files, "attendees")}
            />
          )}

          {activeTab === "money" && sectionFlags.money && (
            <MoneySection
              eventId={event.id}
              budgetedAmount={money?.budgeted_amount ?? null}
              actualAmount={money?.actual_amount ?? null}
              notes={money?.notes ?? null}
              done={money?.done ?? false}
              files={filesFor(files, "money")}
            />
          )}

          {activeTab === "food" && sectionFlags.food && (
            <FoodSection
              eventId={event.id}
              usualOptions={food?.usual_options ?? null}
              halalEnabled={food?.halal_enabled ?? false}
              halalOptions={food?.halal_options ?? null}
              done={food?.done ?? false}
              files={filesFor(files, "food")}
            />
          )}

          {activeTab === "marketing" && sectionFlags.marketing && (
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

          {activeTab === "media" && sectionFlags.media && (
            <MediaSection eventId={event.id} done={event.media_done} files={filesFor(files, "media")} />
          )}

          {activeTab === "notes" && <NotesField eventId={event.id} notes={event.notes} />}
        </div>
      </div>
    </div>
  );
}
