"use client";

import { useRef, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEvent } from "@/lib/actions/events";
import { toggleFormSchema, type ToggleFormValues } from "@/lib/validation/event-schemas";
import { SECTION_COLORS } from "@/lib/utils/section-colors";

const TOGGLE_ITEMS: { key: keyof ToggleFormValues; label: keyof typeof SECTION_COLORS }[] = [
  { key: "hasSpeaker", label: "Speaker" },
  { key: "hasAttendees", label: "Attendees" },
  { key: "hasMoney", label: "Money" },
  { key: "hasFood", label: "Food" },
  { key: "hasMarketing", label: "Marketing" },
  { key: "hasMedia", label: "Media" },
];

function SectionFlag({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2 w-[9px] shrink-0"
      style={{ background: color, clipPath: "polygon(50% 0,100% 100%,0 100%)" }}
    />
  );
}

export function ToggleForm({
  defaultMediaOn = false,
  defaultDate,
  defaultName,
  ideaId,
}: {
  defaultMediaOn?: boolean;
  defaultDate?: string;
  defaultName?: string;
  ideaId?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const endDateTouched = useRef(false);
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ToggleFormValues>({
    resolver: zodResolver(toggleFormSchema),
    defaultValues: {
      name: defaultName ?? "",
      eventDate: defaultDate ?? "",
      eventEndDate: defaultDate ?? "",
      allDay: false,
      eventStartTime: "",
      eventEndTime: "",
      venue: "",
      hasSpeaker: !!ideaId,
      hasAttendees: false,
      hasMoney: false,
      hasFood: false,
      hasMarketing: false,
      hasMedia: defaultMediaOn,
      repeatsFrequency: null,
      repeatsEndsMode: "date",
      repeatsEndDate: "",
      repeatsOccurrenceCount: 6,
    },
  });

  const values = watch();
  // Venue and Notes are always prepped sections regardless of the switches.
  const sectionsSelected =
    TOGGLE_ITEMS.filter((item) => values[item.key]).length + (values.repeatsFrequency ? 1 : 0) + 2;

  function onSubmit(values: ToggleFormValues) {
    startTransition(async () => {
      try {
        if (ideaId) {
          await createEvent(values, ideaId);
        } else {
          await createEvent(values);
        }
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        toast.error("Couldn't create event — try again");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-[580px] flex-col gap-[19px]">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name" className="font-sans text-[12px] font-normal text-body">
          Event name
        </Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="font-sans text-[12px] text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex items-center justify-between">
        <Label className="font-sans text-[12px] font-normal text-body">When</Label>
        <label className="flex items-center gap-2">
          <span className="font-sans text-[12px] text-body">All day</span>
          <Controller
            name="allDay"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  // Times stay required by the schema even when hidden —
                  // an all-day event just gets a fixed full-day range under
                  // the hood instead of asking the user to pick one.
                  if (checked) {
                    setValue("eventStartTime", "00:00");
                    setValue("eventEndTime", "23:45");
                  }
                }}
              />
            )}
          />
        </label>
      </div>
      <div className="flex gap-[11px]">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="eventDate" className="font-sans text-[12px] font-normal text-body">
            Start date
          </Label>
          <Controller
            name="eventDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="eventDate"
                value={field.value}
                onChange={(v) => {
                  field.onChange(v);
                  if (!endDateTouched.current) setValue("eventEndDate", v);
                }}
              />
            )}
          />
          {errors.eventDate && (
            <p className="font-sans text-[12px] text-destructive">{errors.eventDate.message}</p>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="eventEndDate" className="font-sans text-[12px] font-normal text-body">
            End date
          </Label>
          <Controller
            name="eventEndDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="eventEndDate"
                value={field.value}
                onChange={(v) => {
                  endDateTouched.current = true;
                  field.onChange(v);
                }}
              />
            )}
          />
          {errors.eventEndDate && (
            <p className="font-sans text-[12px] text-destructive">{errors.eventEndDate.message}</p>
          )}
        </div>
      </div>
      {!values.allDay && (
        <div className="flex gap-[11px]">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="eventStartTime" className="font-sans text-[12px] font-normal text-body">
              Start time
            </Label>
            <Controller
              name="eventStartTime"
              control={control}
              render={({ field }) => (
                <TimePicker id="eventStartTime" value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.eventStartTime && (
              <p className="font-sans text-[12px] text-destructive">{errors.eventStartTime.message}</p>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="eventEndTime" className="font-sans text-[12px] font-normal text-body">
              End time
            </Label>
            <Controller
              name="eventEndTime"
              control={control}
              render={({ field }) => (
                <TimePicker id="eventEndTime" value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.eventEndTime && (
              <p className="font-sans text-[12px] text-destructive">{errors.eventEndTime.message}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-[11px]">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="repeatsFrequency" className="font-sans text-[12px] font-normal text-body">
            Repeats
          </Label>
          <Controller
            name="repeatsFrequency"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? "none"}
                onValueChange={(v) => field.onChange(v === "none" ? null : v)}
              >
                <SelectTrigger id="repeatsFrequency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {values.repeatsFrequency && (
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="repeatsEndsMode" className="font-sans text-[12px] font-normal text-body">
              Ends
            </Label>
            <Controller
              name="repeatsEndsMode"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? "date"} onValueChange={field.onChange}>
                  <SelectTrigger id="repeatsEndsMode" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">On date</SelectItem>
                    <SelectItem value="count">After N times</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
        {values.repeatsFrequency && values.repeatsEndsMode !== "count" && (
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="repeatsEndDate" className="font-sans text-[12px] font-normal text-body">
              End date
            </Label>
            <Controller
              name="repeatsEndDate"
              control={control}
              render={({ field }) => (
                <DatePicker id="repeatsEndDate" value={field.value ?? ""} onChange={field.onChange} />
              )}
            />
            {errors.repeatsEndDate && (
              <p className="font-sans text-[12px] text-destructive">{errors.repeatsEndDate.message}</p>
            )}
          </div>
        )}
        {values.repeatsFrequency && values.repeatsEndsMode === "count" && (
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="repeatsOccurrenceCount" className="font-sans text-[12px] font-normal text-body">
              Occurrences
            </Label>
            <Controller
              name="repeatsOccurrenceCount"
              control={control}
              render={({ field }) => (
                <Input
                  id="repeatsOccurrenceCount"
                  type="number"
                  min={1}
                  max={104}
                  value={field.value ?? 6}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
            {errors.repeatsOccurrenceCount && (
              <p className="font-sans text-[12px] text-destructive">
                {errors.repeatsOccurrenceCount.message}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="venue" className="font-sans text-[12px] font-normal text-body">
          Venue
        </Label>
        <Input id="venue" {...register("venue")} />
        {errors.venue && <p className="font-sans text-[12px] text-destructive">{errors.venue.message}</p>}
      </div>

      <div className="flex flex-col gap-[9px]">
        <div className="flex flex-col gap-[3px]">
          <p className="font-sans text-[14px] font-medium text-ink">What does this event need?</p>
          <p className="font-sans text-[12.5px] text-faint">
            Each one you turn on becomes a section to prep in step 2.
          </p>
        </div>
        <div className="overflow-hidden rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper">
          {TOGGLE_ITEMS.map((item, i) => (
            <div
              key={item.key}
              className={`flex items-center justify-between px-[15px] py-3 transition-colors duration-200 hover:bg-wash ${
                i < TOGGLE_ITEMS.length - 1 ? "border-b border-[rgba(35,32,28,0.07)]" : ""
              }`}
            >
              <Label
                htmlFor={item.key}
                className="gap-[9px] font-sans text-[13.5px] font-normal text-ink"
              >
                <SectionFlag color={SECTION_COLORS[item.label]} />
                {item.label}
              </Label>
              <Controller
                name={item.key}
                control={control}
                render={({ field }) => (
                  <Switch
                    id={item.key}
                    checked={field.value as boolean}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-[14px]">
        <Button type="submit" loading={isPending} className="px-5 py-2.5 text-[13px]">
          {isPending ? "Creating…" : "Continue"}
        </Button>
        <span className="font-sans text-[12.5px] text-faint">
          {sectionsSelected} sections selected
        </span>
      </div>
    </form>
  );
}
