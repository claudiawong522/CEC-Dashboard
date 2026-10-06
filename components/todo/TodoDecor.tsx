"use client";

import { TriangleScatter } from "@/components/decor/shapes";

/** Ambient decor for the Todo list: logo tiles behind the header, clipped
 * by the page's own overflow so they never compete with row content. */
export function TodoDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-4 z-0 h-32 overflow-hidden">
      <TriangleScatter count={4} seed={21} opacity={0.2} />
    </div>
  );
}
