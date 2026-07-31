"use client";

import { Sticker } from "@/components/stickers/Sticker";
import { Sparkle, Bow } from "@/components/stickers/shapes";

/** Ambient corner decor behind the Search header. */
export function SearchDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 overflow-hidden">
      <Sticker
        floatVariant="float1"
        floatDuration="15s"
        wrapperClassName="pointer-events-none absolute right-[12%] top-0"
        className="pointer-events-auto opacity-[0.4]"
      >
        <Sparkle size={64} />
      </Sticker>
      <Sticker
        floatVariant="float2"
        floatDuration="18s"
        floatDelay="1.2s"
        wrapperClassName="pointer-events-none absolute right-[28%] top-2"
        className="pointer-events-auto opacity-[0.35]"
      >
        <Bow size={50} />
      </Sticker>
    </div>
  );
}
