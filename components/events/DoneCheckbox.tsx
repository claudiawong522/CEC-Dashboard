"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setSectionDone } from "@/lib/actions/events";

export function DoneCheckbox({
  eventId,
  section,
  initialDone,
}: {
  eventId: string;
  section: string;
  initialDone: boolean;
}) {
  const [done, setDone] = useState(initialDone);
  const [isPending, startTransition] = useTransition();

  function handleChange() {
    const next = !done;
    setDone(next);
    startTransition(async () => {
      try {
        await setSectionDone(eventId, section, next);
      } catch {
        setDone(!next);
        toast.error("Couldn't update — try again");
      }
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleChange}
      className="inline-flex items-center gap-[9px] py-1.5 pr-3 pl-1.5 transition-colors duration-200 ease-fluid hover:bg-muted/40"
    >
      <span
        className="flex size-5 items-center justify-center border-2 border-foreground transition-[background-color] duration-[260ms] ease-fluid"
        style={{ background: done ? "var(--mint)" : "transparent" }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <polyline
            points="2,6.4 4.6,9 10,3.2"
            stroke="var(--black)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="14"
            // The animated value must live on the SVG presentation attribute,
            // not a React style object: a hyphenated CSS property inside a
            // style prop silently fails to transition (design/BRAND_KIT.md
            // implementation gotcha #2).
            strokeDashoffset={done ? 0 : 14}
            style={{ transition: "stroke-dashoffset 360ms cubic-bezier(.4,0,.2,1) 40ms" }}
          />
        </svg>
      </span>
      <span
        className="relative inline-block font-sans text-[13px] transition-colors duration-300"
        style={{ color: done ? "var(--faint)" : "var(--black)" }}
      >
        Mark as done
        <span
          className="absolute top-[53%] left-0 h-px bg-foreground/50 transition-[width] duration-[340ms] ease-draw"
          style={{ width: done ? "100%" : "0%" }}
        />
      </span>
    </button>
  );
}
