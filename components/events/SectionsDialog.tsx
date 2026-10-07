"use client";

import { SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
      <DialogTrigger
        render={<Button variant="outline" size="icon-sm" aria-label="Sections" />}
        nativeButton
      >
        <SlidersHorizontal />
      </DialogTrigger>
      <DialogContent className="border border-line bg-background p-4 shadow-soft ring-0 sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px] font-bold text-foreground">Sections</DialogTitle>
        </DialogHeader>
        <p className="font-sans text-[12px] leading-[1.5] text-foreground/50">
          Turn sections on or off. Anything already filled in stays put if you turn one back on.
        </p>
        <div className="overflow-hidden border border-line bg-background">
          {SECTION_ITEMS.map((item, i) => (
            <div
              key={item.key}
              className={`flex items-center justify-between px-[15px] py-3 transition-colors duration-200 ease-fluid hover:bg-muted/40 ${
                i < SECTION_ITEMS.length - 1 ? "border-b border-line" : ""
              }`}
            >
              <Label
                htmlFor={`section-${item.key}`}
                className="gap-[9px] font-sans text-[13.5px] font-normal text-foreground"
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
