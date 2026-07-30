"use client";

import { useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { saveNotesDoc } from "@/lib/actions/notes";

// design/BRAND_KIT.md colours, mapped onto BlockNote's theme API — this is
// the library's own customization surface, not a fork of its internals.
const brandTheme = {
  colors: {
    editor: { text: "#23201C", background: "#FFFDF9" },
    menu: { text: "#23201C", background: "#FFFDF9" },
    tooltip: { text: "#FDFAF4", background: "#23201C" },
    hovered: { text: "#23201C", background: "#F5F0E5" },
    selected: { text: "#23201C", background: "#F5F0E5" },
    disabled: { text: "#B0A899", background: "#FFFDF9" },
    shadow: "rgba(35,32,28,.5)",
    border: "rgba(35,32,28,.1)",
    sideMenu: "#E2DACB",
    highlights: {
      orange: { text: "#23201C", background: "rgba(232,88,61,.26)" },
    },
  },
  borderRadius: 10,
  fontFamily: "var(--font-hanken-grotesk), system-ui, sans-serif",
};

export function NotesEditor({
  initialContent,
  editable,
}: {
  initialContent: PartialBlock[];
  editable: boolean;
}) {
  const editor = useCreateBlockNote({
    initialContent: initialContent.length > 0 ? initialContent : undefined,
  });
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange() {
    if (!editable) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveNotesDoc(editor.document).catch(() => {
        // Autosave is best-effort; the next successful edit will retry.
      });
    }, 1000);
  }

  return (
    <BlockNoteView editor={editor} editable={editable} onChange={handleChange} theme={brandTheme} />
  );
}
