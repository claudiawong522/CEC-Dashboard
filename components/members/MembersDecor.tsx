"use client";

import { TriangleScatter } from "@/components/decor/shapes";

/** The logo's tiles, scattered behind the Members page. */
export function MembersDecor() {
  return <TriangleScatter count={5} seed={11} opacity={0.2} />;
}
