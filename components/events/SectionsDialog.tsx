"use client";

import { SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SECTION_COLORS } from "@/lib/utils/section-colors";
import type { OptionalEventSection } from "@/lib/actions/events";

const SECTION_ITEMS: { key: OptionalEventSection; label: keyof typeof SECTION_COLORS }[] = [
  { key: "speaker", label: "Speaker" },
  { key: "attendees", label: "Attendees" },
  { key: "money", label: "Money" },
  { key: "food", label: "Food" },
  { key: "marketing", label: "Marketing" },
  { key: "media", label: "Media" },
];

function SectionFlag({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2 w-[9px] shrink-0"
      style={{ background: color, clipPath: "polygon(50% 0,100% 100%,0 100%)" }}
    />
  );
}

export function SectionsDialog({
  flags,
  onToggle,
}: {
  flags: Record<OptionalEventSection, boolean>;
  onToggle: (section: OptionalEventSection, enabled: boolean) => void;
}) {
  return (
    <Dialog>
      <DialogTrigger className="flex size-8 items-center justify-center rounded-btn text-faint transition-colors duration-200 hover:bg-wash hover:text-ink">
        <SlidersHorizontal className="size-4" />
      </DialogTrigger>
      <DialogContent className="rounded-card border border-line bg-paper p-4 ring-0 sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="font-sans text-[15px] font-medium text-ink">Sections</DialogTitle>
        </DialogHeader>
        <p className="font-sans text-[12px] leading-[1.5] text-faint">
          Turn sections on or off. Anything already filled in stays put if you turn one back on.
        </p>
        <div className="overflow-hidden rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper">
          {SECTION_ITEMS.map((item, i) => (
            <div
              key={item.key}
              className={`flex items-center justify-between px-[15px] py-3 transition-colors duration-200 hover:bg-wash ${
                i < SECTION_ITEMS.length - 1 ? "border-b border-[rgba(35,32,28,0.07)]" : ""
              }`}
            >
              <Label
                htmlFor={`section-${item.key}`}
                className="gap-[9px] font-sans text-[13.5px] font-normal text-ink"
              >
                <SectionFlag color={SECTION_COLORS[item.label]} />
                {item.label}
              </Label>
              <Switch
                id={`section-${item.key}`}
                checked={flags[item.key]}
                onCheckedChange={(checked) => onToggle(item.key, checked)}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
