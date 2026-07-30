"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/events/SectionCard";
import { EvidenceUploader, type UploadedFile } from "@/components/events/EvidenceUploader";
import { updateMarketing } from "@/lib/actions/events";
import {
  addCustomMarketingItem,
  toggleCustomMarketingItem,
  deleteCustomMarketingItem,
} from "@/lib/actions/marketing";
import type { MarketingValues } from "@/lib/validation/event-schemas";
import type { MarketingCustomItemRow } from "@/lib/types/events";

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
  customItems,
  files,
}: {
  eventId: string;
  done: boolean;
  values: MarketingValues;
  customItems: MarketingCustomItemRow[];
  files: UploadedFile[];
}) {
  const [state, setState] = useState(values);
  const [items, setItems] = useState(customItems);
  const [newLabel, setNewLabel] = useState("");
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

  function handleAddCustom() {
    const label = newLabel.trim();
    if (!label) return;
    setNewLabel("");
    startTransition(async () => {
      try {
        const item = await addCustomMarketingItem(eventId, label);
        setItems((prev) => [...prev, item]);
      } catch {
        toast.error("Couldn't add item");
      }
    });
  }

  function handleToggleCustom(itemId: string, checked: boolean) {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, done: checked } : i)));
    startTransition(async () => {
      try {
        await toggleCustomMarketingItem(itemId, eventId, checked);
      } catch {
        setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, done: !checked } : i)));
        toast.error("Couldn't update item");
      }
    });
  }

  function handleDeleteCustom(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    startTransition(async () => {
      try {
        await deleteCustomMarketingItem(itemId, eventId);
      } catch {
        toast.error("Couldn't delete item");
      }
    });
  }

  return (
    <SectionCard title="Marketing" eventId={eventId} section="marketing" done={done}>
      <div className="grid grid-cols-2 gap-x-5 gap-y-[9px]">
        {ITEMS.map((item) => (
          <label
            key={item.key}
            className={cn(
              "flex items-center gap-[9px] font-sans text-[13px]",
              state[item.key] ? "text-ink" : "text-body",
            )}
          >
            <Checkbox
              checked={state[item.key]}
              onCheckedChange={(checked) => handleToggle(item.key, checked)}
            />
            {item.label}
          </label>
        ))}
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "group flex items-center gap-[9px] font-sans text-[13px]",
              item.done ? "text-ink" : "text-body",
            )}
          >
            <Checkbox
              checked={item.done}
              onCheckedChange={(checked) => handleToggleCustom(item.id, checked)}
            />
            <span className="flex-1 truncate">{item.label}</span>
            <button
              type="button"
              onClick={() => handleDeleteCustom(item.id)}
              className="font-sans text-[12px] text-faded opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-[9px]">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddCustom();
            }
          }}
          placeholder="Add a custom channel…"
          className="max-w-[260px] px-[11px] py-2 text-[12.5px]"
        />
        <Button size="sm" variant="outline" onClick={handleAddCustom} disabled={!newLabel.trim()}>
          Add
        </Button>
      </div>

      <EvidenceUploader
        eventId={eventId}
        section="marketing"
        bucket="evidence"
        dropLabel="photo evidence"
        label="Drop screenshots of the posts"
        initialFiles={files}
        accept={{ "image/*": [] }}
      />
    </SectionCard>
  );
}
