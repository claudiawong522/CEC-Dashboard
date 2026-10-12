"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { TaggedMembersSection } from "@/components/events/sections/TaggedMembersSection";
import { MoneySection } from "@/components/events/sections/MoneySection";
import { FoodSection } from "@/components/events/sections/FoodSection";
import { MarketingSection } from "@/components/events/sections/MarketingSection";
import { MediaSection } from "@/components/events/sections/MediaSection";
import { SECTION_COLORS, type SectionLabel } from "@/lib/utils/section-colors";
import { Confetti, TriangleScatter } from "@/components/decor/shapes";
import { PageHeader } from "@/components/ui/page-header";
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
import type { Profile } from "@/lib/auth/getSession";

const REPEAT_LABELS = { weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly" };
const ENDS_MODE_LABELS = { date: "On date", count: "After N times" };

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
  taggedMembers,
  allMembers,
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
  taggedMembers: Profile[];
  allMembers: Profile[];
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
        toast.error("Couldn't update section. Try again.");
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
    <div className="relative flex max-w-[1180px] flex-col gap-5">
      <TriangleScatter count={4} seed={61} opacity={0.18} className="z-0 h-40" />
      <Link
        href="/calendar"
        className="t-eyebrow relative z-10 inline-flex w-fit items-center text-foreground/50 transition-colors duration-200 ease-fluid hover:text-foreground max-md:min-h-11"
      >
        ← Calendar
      </Link>
      <PageHeader
        className="relative z-10"
        eyebrow="Event · Step 2 of 2"
        title={<span className="[overflow-wrap:anywhere]">{name.trim() || "Untitled event"}</span>}
        actions={
          <>
            <span
              className={cn(
                "t-eyebrow relative mr-1 overflow-visible border px-2 py-1 text-foreground tabular-nums",
                doneCount === doneable.length ? "border-foreground bg-mint" : "border-line bg-background",
              )}
            >
              {doneCount} of {doneable.length} done
              {doneCount === doneable.length && (
                <Confetti
                  size={28}
                  className="pointer-events-none absolute -top-1.5 -right-1.5 opacity-90"
                />
              )}
            </span>
            <SectionsDialog flags={sectionFlags} onToggle={handleToggleSection} />
            <DeleteEventDialog eventId={event.id} isRecurring={!!event.recurring_series_id} />
          </>
        }
      />

      <div className="relative z-10 flex flex-col gap-4 border border-line bg-background p-4 shadow-soft sm:p-5">
        {/* Phones stack the header: name full width, the two dates side by
            side, then All day and the save state on their own row. From md
            the wrappers dissolve (md:contents) back into the one flat row. */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex flex-col gap-1.5 md:flex-[2]">
            <Label>Event name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:contents">
            <div className="flex min-w-0 flex-col gap-1.5 md:flex-1">
              <Label>Start date</Label>
              <DatePicker
                value={date}
                onChange={(v) => {
                  setDate(v);
                  if (endDate === date || !endDate) setEndDate(v);
                }}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5 md:flex-1">
              <Label>End date</Label>
              <DatePicker value={endDate} onChange={setEndDate} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 md:contents">
            <label className="flex min-h-11 items-center gap-2 md:min-h-0 md:pb-2.5">
              <span className="font-sans text-[12px] text-subtle">All day</span>
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
            <SaveIndicator status={headerStatus} className="md:pb-2.5" />
          </div>
        </div>
        {!allDay && (
          <div className="grid grid-cols-2 gap-3 md:flex md:items-end">
            <div className="flex min-w-0 flex-col gap-1.5 md:flex-1">
              <Label>Start time</Label>
              <TimePicker value={startTime} onChange={setStartTime} />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5 md:flex-1">
              <Label>End time</Label>
              <TimePicker value={endTime} onChange={setEndTime} />
            </div>
            <div className="hidden md:block md:flex-[2]" />
          </div>
        )}

        {event.recurring_series_id && (
          <p className="font-sans text-[11.5px] text-foreground/50">
            Name and time changes apply to this and future occurrences. Past ones are left as-is.
          </p>
        )}

        <TaggedMembersSection eventId={event.id} taggedMembers={taggedMembers} allMembers={allMembers} />

        {recurringSeries && (
          <div className="grid grid-cols-2 gap-3 border-t border-line pt-4 md:flex md:items-end">
            <div className="flex min-w-0 flex-col gap-1.5 md:flex-1">
              <Label>Repeats</Label>
              <Select
                items={REPEAT_LABELS}
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
            <div className="flex min-w-0 flex-col gap-1.5 md:flex-1">
              <Label>Ends</Label>
              <Select
                items={ENDS_MODE_LABELS}
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
            <div className="col-span-2 flex min-w-0 flex-col gap-1.5 md:flex-1">
              <Label>
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
            <div className="col-span-2 font-sans md:flex-[2] text-[11.5px] text-foreground/50">
              Changing this only affects occurrences that haven&apos;t happened yet. Past ones are
              left as-is.
            </div>
            <SaveIndicator status={repeatsStatus} className="md:pb-2.5" />
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:gap-6">
        {/* Phones: the sections become one horizontally scrolling row above
            the card, bled to the screen edges, the active tab underlined in
            mint the way the sidebar marks the current page. */}
        <div
          role="tablist"
          aria-label="Sections"
          className="-mx-4 flex overflow-x-auto overscroll-x-contain border-b border-line px-4 [scrollbar-width:none] sm:-mx-10 sm:px-10 md:hidden [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={(e) => {
                setActiveTab(tab.key);
                e.currentTarget.scrollIntoView({ inline: "nearest", block: "nearest" });
              }}
              className={cn(
                "relative flex h-11 shrink-0 items-center gap-2 px-3 font-sans text-[14px] whitespace-nowrap transition-[color,box-shadow] duration-200 ease-fluid focus-visible:outline-offset-[-2px]",
                activeTab === tab.key
                  ? "font-medium text-foreground shadow-[inset_0_-3px_0_0_var(--mint)]"
                  : "text-subtle",
              )}
            >
              <span
                className="inline-block h-2 w-[9px] shrink-0"
                style={{
                  background: tab.label === "Notes" ? "var(--amber)" : SECTION_COLORS[tab.label],
                  clipPath: "polygon(50% 0,100% 100%,0 100%)",
                }}
              />
              {tab.label}
              {tab.key !== "notes" && tab.done && (
                <span aria-label="done" className="size-1.5 shrink-0 bg-mint-dark" />
              )}
            </button>
          ))}
        </div>

        {/* Desktop: the kit's vertical tabs. Hairline left rule, a 3px mint
            bar slid between rows by animating `top`, done rows marked with a
            6px mint-dark square. */}
        <nav className="relative hidden w-[184px] shrink-0 flex-col border-l border-line md:flex">
          <div
            aria-hidden="true"
            className="absolute -left-px h-9 w-[3px] bg-mint transition-[top] duration-[340ms] ease-fluid"
            style={{ top: activeIndex * 36 }}
          />
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative flex h-9 items-center gap-[9px] pr-3 pl-4 font-sans text-[13px] transition-colors duration-200 ease-fluid hover:text-foreground focus-visible:outline-offset-[-2px]",
                activeTab === tab.key ? "font-medium text-foreground" : "text-foreground/55",
              )}
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
                  aria-hidden="true"
                  className="ml-auto size-1.5 bg-mint-dark transition-opacity duration-300"
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
