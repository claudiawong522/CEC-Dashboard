"use client";

import { Sticker } from "@/components/stickers/Sticker";
import { Cherries, Flower } from "@/components/stickers/shapes";

/** Ambient corner decor behind the Members header. */
export function MembersDecor() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 overflow-hidden"
    >
      <Sticker
        floatVariant="float2"
        floatDuration="17s"
        wrapperClassName="pointer-events-none absolute right-[8%] top-0"
        className="pointer-events-auto opacity-[0.42]"
      >
        <Flower size={74} />
      </Sticker>
      <Sticker
        floatVariant="float3"
        floatDuration="14s"
        floatDelay="0.8s"
        wrapperClassName="pointer-events-none absolute right-[24%] top-3"
        className="pointer-events-auto opacity-[0.36]"
      >
        <Cherries size={52} />
      </Sticker>
    </div>
  );
}
