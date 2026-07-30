"use client";

import { Sticker } from "@/components/stickers/Sticker";
import { StarPolygon, Confetti } from "@/components/stickers/shapes";

/** Ambient corner decor for the Todo list — sits behind the header, clipped
 * by the page's own overflow so it never competes with row content. */
export function TodoDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-4 z-0 h-32 overflow-hidden">
      <Sticker
        floatVariant="float2"
        floatDuration="15s"
        wrapperClassName="pointer-events-none absolute right-[4%] top-0"
        className="pointer-events-auto opacity-[0.4]"
      >
        <StarPolygon size={84} />
      </Sticker>
      <Sticker
        floatVariant="float3"
        floatDuration="18s"
        floatDelay="1s"
        wrapperClassName="pointer-events-none absolute right-[18%] top-4"
        className="pointer-events-auto opacity-[0.35]"
      >
        <Confetti size={90} />
      </Sticker>
    </div>
  );
}
