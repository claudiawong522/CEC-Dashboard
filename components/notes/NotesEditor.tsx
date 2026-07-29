"use client";

import { useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { saveNotesDoc } from "@/lib/actions/notes";

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
    <BlockNoteView editor={editor} editable={editable} onChange={handleChange} theme="light" />
  );
}
