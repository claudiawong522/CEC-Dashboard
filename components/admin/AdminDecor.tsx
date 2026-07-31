"use client";

import { Sticker } from "@/components/stickers/Sticker";
import { CrescentMoon, StarPolygon } from "@/components/stickers/shapes";

/** Ambient corner decor behind the Admin header. */
export function AdminDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 overflow-hidden">
      <Sticker
        floatVariant="float1"
        floatDuration="16s"
        wrapperClassName="pointer-events-none absolute right-[10%] top-0"
        className="pointer-events-auto opacity-[0.4]"
      >
        <StarPolygon size={68} />
      </Sticker>
      <Sticker
        floatVariant="float2"
        floatDuration="19s"
        floatDelay="1.1s"
        wrapperClassName="pointer-events-none absolute right-[26%] top-2"
        className="pointer-events-auto opacity-[0.35]"
      >
        <CrescentMoon size={54} />
      </Sticker>
    </div>
  );
}
