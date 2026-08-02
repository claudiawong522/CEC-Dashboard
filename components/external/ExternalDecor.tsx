"use client";

import { Sticker } from "@/components/stickers/Sticker";
import { StarPolygon, Sprig } from "@/components/stickers/shapes";

/** Ambient corner decor behind the External header — coral, matching Speaker/Marketing. */
export function ExternalDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 overflow-hidden">
      <Sticker
        floatVariant="float1"
        floatDuration="17s"
        wrapperClassName="pointer-events-none absolute right-[8%] top-0"
        className="pointer-events-auto opacity-[0.4]"
      >
        <StarPolygon size={72} />
      </Sticker>
      <Sticker
        floatVariant="float2"
        floatDuration="14s"
        floatDelay="0.8s"
        wrapperClassName="pointer-events-none absolute right-[24%] top-4"
        className="pointer-events-auto opacity-[0.3]"
      >
        <Sprig size={48} />
      </Sticker>
    </div>
  );
}
