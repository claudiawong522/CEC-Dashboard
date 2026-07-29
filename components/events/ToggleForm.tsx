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

const TOGGLE_ITEMS: { key: keyof ToggleFormValues; label: string }[] = [
  { key: "hasSpeaker", label: "Speaker" },
  { key: "hasAttendees", label: "Attendees" },
  { key: "hasMoney", label: "Money" },
  { key: "hasFood", label: "Food" },
  { key: "hasMarketing", label: "Marketing" },
  { key: "hasMedia", label: "Media" },
  { key: "hasRecurring", label: "Recurring" },
];

export function ToggleForm() {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Event name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="eventDate">Date</Label>
            <Input id="eventDate" type="date" {...register("eventDate")} />
            {errors.eventDate && (
              <p className="text-xs text-destructive">{errors.eventDate.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="eventStartTime">Start time</Label>
            <Input id="eventStartTime" type="time" {...register("eventStartTime")} />
            {errors.eventStartTime && (
              <p className="text-xs text-destructive">{errors.eventStartTime.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="eventEndTime">End time</Label>
            <Input id="eventEndTime" type="time" {...register("eventEndTime")} />
            {errors.eventEndTime && (
              <p className="text-xs text-destructive">{errors.eventEndTime.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="venue">Venue</Label>
          <Input id="venue" {...register("venue")} />
          {errors.venue && <p className="text-xs text-destructive">{errors.venue.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">What does this event need?</p>
        <p className="text-xs text-muted-foreground">
          Toggle on whichever sections apply — you&rsquo;ll fill in the details next.
        </p>
        <div className="mt-2 flex flex-col divide-y divide-stone-100 rounded-lg border border-stone-200">
          {TOGGLE_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between px-3 py-2.5">
              <Label htmlFor={item.key} className="text-sm font-normal">
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

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Creating..." : "Continue"}
      </Button>
    </form>
  );
}
