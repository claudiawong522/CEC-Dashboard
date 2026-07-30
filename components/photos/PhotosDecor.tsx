"use client";

import { Sticker } from "@/components/stickers/Sticker";
import { Bow, Sparkle } from "@/components/stickers/shapes";

/** Ambient corner decor behind the Photos grid header. */
export function PhotosDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-20 overflow-hidden">
      <Sticker
        floatVariant="float1"
        floatDuration="14s"
        wrapperClassName="pointer-events-none absolute right-[10%] top-1"
        className="pointer-events-auto opacity-[0.1]"
      >
        <Bow size={44} />
      </Sticker>
      <Sticker
        floatVariant="float2"
        floatDuration="17s"
        floatDelay="1.4s"
        wrapperClassName="pointer-events-none absolute right-[26%] -top-2"
        className="pointer-events-auto opacity-[0.1]"
      >
        <Sparkle size={30} />
      </Sticker>
    </div>
  );
}
