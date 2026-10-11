"use client";

import dynamic from "next/dynamic";

// BlockNote touches `window` while it builds the editor, so rendering it on
// the server throws and React falls back to client rendering with an error.
// Loading it client-only skips the server pass entirely; the placeholder
// holds the editor's first line so the page does not jump when it arrives.
export const NotesEditor = dynamic(
  () => import("@/components/notes/NotesEditor").then((mod) => mod.NotesEditor),
  {
    ssr: false,
    loading: () => <div aria-hidden="true" className="min-h-[120px]" />,
  },
);
