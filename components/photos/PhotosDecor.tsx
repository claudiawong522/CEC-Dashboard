"use client";

import { TriangleScatter } from "@/components/decor/shapes";

/** Ambient decor behind the Photos grid header. */
export function PhotosDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 overflow-hidden">
      <TriangleScatter count={4} seed={31} opacity={0.2} />
    </div>
  );
}
