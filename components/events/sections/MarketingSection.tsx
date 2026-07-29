"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionCard } from "@/components/events/SectionCard";
import { EvidenceUploader, type UploadedFile } from "@/components/events/EvidenceUploader";
import { updateMarketing } from "@/lib/actions/events";
import type { MarketingValues } from "@/lib/validation/event-schemas";

const ITEMS: { key: keyof MarketingValues; label: string }[] = [
  { key: "instagramPost", label: "Instagram post" },
  { key: "eshipListserve", label: "Eship listserve" },
  { key: "storyShoutout1", label: "Story shoutout 1" },
  { key: "storyShoutout2", label: "Story shoutout 2" },
  { key: "storyShoutout3", label: "Story shoutout 3" },
  { key: "posters", label: "Posters" },
  { key: "reel", label: "Reel" },
];

export function MarketingSection({
  eventId,
  done,
  values,
  files,
}: {
  eventId: string;
  done: boolean;
  values: MarketingValues;
  files: UploadedFile[];
}) {
  const [state, setState] = useState(values);
  const [, startTransition] = useTransition();

  function handleToggle(key: keyof MarketingValues, checked: boolean) {
    const next = { ...state, [key]: checked };
    setState(next);
    startTransition(async () => {
      try {
        await updateMarketing(eventId, next);
      } catch {
        setState(state);
        toast.error("Couldn't update marketing");
      }
    });
  }

  return (
    <SectionCard title="Marketing" eventId={eventId} section="marketing" done={done}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {ITEMS.map((item) => (
          <label key={item.key} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={state[item.key]}
              onCheckedChange={(checked) => handleToggle(item.key, checked)}
            />
            {item.label}
          </label>
        ))}
      </div>
      <EvidenceUploader
        eventId={eventId}
        section="marketing"
        bucket="evidence"
        initialFiles={files}
        accept={{ "image/*": [] }}
      />
    </SectionCard>
  );
}
