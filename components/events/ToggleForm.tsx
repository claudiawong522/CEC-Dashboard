"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  { key: "hasRecurring", label: "Recurring" },
];

function SectionFlag({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2 w-[9px] shrink-0"
      style={{ background: color, clipPath: "polygon(50% 0,100% 100%,0 100%)" }}
    />
  );
}

export function ToggleForm() {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ToggleFormValues>({
    resolver: zodResolver(toggleFormSchema),
    defaultValues: {
      name: "",
      eventDate: "",
      eventStartTime: "",
      eventEndTime: "",
      venue: "",
      hasSpeaker: false,
      hasAttendees: false,
      hasMoney: false,
      hasFood: false,
      hasMarketing: false,
      hasMedia: false,
      hasRecurring: false,
    },
  });

  const values = watch();
  // Venue and Notes are always prepped sections regardless of the switches.
  const sectionsSelected =
    TOGGLE_ITEMS.filter((item) => values[item.key]).length + 2;

  function onSubmit(values: ToggleFormValues) {
    startTransition(async () => {
      try {
        await createEvent(values);
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        toast.error("Couldn't create event — try again");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-[580px] flex-col gap-[19px]">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name" className="font-sans text-xs font-normal text-body">
          Event name
        </Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="font-sans text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex gap-[11px]">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="eventDate" className="font-sans text-xs font-normal text-body">
            Date
          </Label>
          <Input id="eventDate" type="date" {...register("eventDate")} />
          {errors.eventDate && (
            <p className="font-sans text-xs text-destructive">{errors.eventDate.message}</p>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="eventStartTime" className="font-sans text-xs font-normal text-body">
            Start time
          </Label>
          <Input id="eventStartTime" type="time" {...register("eventStartTime")} />
          {errors.eventStartTime && (
            <p className="font-sans text-xs text-destructive">{errors.eventStartTime.message}</p>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="eventEndTime" className="font-sans text-xs font-normal text-body">
            End time
          </Label>
          <Input id="eventEndTime" type="time" {...register("eventEndTime")} />
          {errors.eventEndTime && (
            <p className="font-sans text-xs text-destructive">{errors.eventEndTime.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="venue" className="font-sans text-xs font-normal text-body">
          Venue
        </Label>
        <Input id="venue" {...register("venue")} />
        {errors.venue && <p className="font-sans text-xs text-destructive">{errors.venue.message}</p>}
      </div>

      <div className="flex flex-col gap-[9px]">
        <div className="flex flex-col gap-[3px]">
          <p className="font-sans text-sm font-medium text-ink">What does this event need?</p>
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
        <Button type="submit" disabled={isPending} className="px-5 py-2.5 text-[13px]">
          {isPending ? "Creating..." : "Continue"}
        </Button>
        <span className="font-sans text-[12.5px] text-faint">
          {sectionsSelected} sections selected
        </span>
      </div>
    </form>
  );
}
