"use client";

import { Sticker } from "@/components/stickers/Sticker";
import { Bow, Sparkle } from "@/components/stickers/shapes";

/** Ambient corner decor behind the Photos grid header. */
export function PhotosDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 overflow-hidden">
      <Sticker
        floatVariant="float1"
        floatDuration="14s"
        wrapperClassName="pointer-events-none absolute right-[8%] top-1"
        className="pointer-events-auto opacity-[0.4]"
      >
        <Bow size={72} />
      </Sticker>
      <Sticker
        floatVariant="float2"
        floatDuration="17s"
        floatDelay="1.4s"
        wrapperClassName="pointer-events-none absolute right-[24%] top-0"
        className="pointer-events-auto opacity-[0.4]"
      >
        <Sparkle size={52} />
      </Sticker>
    </div>
  );
}
