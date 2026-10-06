"use client";

import { useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { PartialBlock } from "@blocknote/core";
import { en } from "@blocknote/core/locales";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

// design/BRAND_KIT.md colours, mapped onto BlockNote's theme API — this is
// the library's own customization surface, not a fork of its internals.
const brandTheme = {
  colors: {
    editor: { text: "var(--ink)", background: "transparent" },
    menu: { text: "var(--ink)", background: "var(--paper)" },
    tooltip: { text: "var(--page)", background: "var(--ink)" },
    hovered: { text: "var(--ink)", background: "var(--hover)" },
    selected: { text: "var(--ink)", background: "var(--hover)" },
    disabled: { text: "var(--faint)", background: "var(--paper)" },
    shadow: "rgba(0,0,0,.5)",
    border: "rgba(0,0,0,.1)",
    highlights: {
      orange: { text: "var(--ink)", background: "rgba(217,80,112,.26)" },
    },
  },
  borderRadius: 10,
  fontFamily: "var(--font-hanken-grotesk), system-ui, sans-serif",
};

// design/README.md's exact copy — BlockNote's own default is
// "Enter text or type '/' for commands".
const dictionary = {
  ...en,
  placeholders: { ...en.placeholders, default: "Type '/' for commands" },
};

export function NotesEditor({
  initialContent,
  editable,
  // Which document this editor is writing to. Passed in rather than baked in
  // since 0038: the club doc is now one brain note among many, and every
  // other note uses the same editor.
  onSave,
}: {
  initialContent: PartialBlock[];
  editable: boolean;
  onSave: (content: unknown) => Promise<void>;
}) {
  const editor = useCreateBlockNote({
    initialContent: initialContent.length > 0 ? initialContent : undefined,
    dictionary,
  });
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange() {
    if (!editable) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      onSave(editor.document).catch(() => {
        // Autosave is best-effort; the next successful edit will retry.
      });
    }, 1000);
  }

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      onChange={handleChange}
      theme={brandTheme}
      sideMenu={false}
    />
  );
}
