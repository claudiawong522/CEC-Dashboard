"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateMemberPosition } from "@/lib/actions/admin";

// Sentinel for the "type your own" row; no real title can start with "__".
const CUSTOM = "__custom";

// A real dropdown of known titles. Picking "Custom title" swaps in a text box
// that saves on blur or Enter (Escape cancels), for a one-off title.
export function PositionInput({
  userId,
  position,
  options,
  label,
}: {
  userId: string;
  position: string;
  options: string[];
  label: string;
}) {
  const [saved, setSaved] = useState(position);
  const [custom, setCustom] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const cancelled = useRef(false);

  const choices = options.includes(saved) ? options : [saved, ...options];
  const items = Object.fromEntries([
    ...choices.map((title) => [title, title]),
    [CUSTOM, "Custom title…"],
  ]);

  function save(next: string) {
    const title = next.trim();
    if (!title || title === saved) return;
    const previous = saved;
    setSaved(title);
    startTransition(async () => {
      try {
        const result = await updateMemberPosition(userId, title);
        if (!result.ok) {
          setSaved(previous);
          toast.error(result.message);
          return;
        }
        toast.success("Position updated");
      } catch {
        setSaved(previous);
        toast.error("Couldn't update position");
      }
    });
  }

  if (custom !== null) {
    return (
      <Input
        autoFocus
        value={custom}
        aria-label={label}
        placeholder="Type a title"
        disabled={isPending}
        onChange={(e) => setCustom(e.target.value)}
        onBlur={() => {
          if (!cancelled.current) save(custom);
          cancelled.current = false;
          setCustom(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            cancelled.current = true;
            e.currentTarget.blur();
          }
        }}
        className="py-1.5 text-[13px] md:max-w-[220px]"
      />
    );
  }

  return (
    <Select
      items={items}
      value={saved}
      onValueChange={(v) => {
        if (v === CUSTOM) setCustom("");
        else if (typeof v === "string") save(v);
      }}
    >
      <SelectTrigger
        aria-label={label}
        disabled={isPending}
        className="w-full justify-between border-line bg-background px-2.5 py-1.5 text-[13px] hover:border-foreground md:max-w-[220px] max-md:min-h-11 [&_svg]:text-foreground/50"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="min-w-max">
        {choices.map((title) => (
          <SelectItem key={title} value={title}>
            {title}
          </SelectItem>
        ))}
        <SelectItem value={CUSTOM}>Custom title…</SelectItem>
      </SelectContent>
    </Select>
  );
}
