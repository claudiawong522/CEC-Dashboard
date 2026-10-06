"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LinkIcon, SearchIcon } from "lucide-react";
import { preview, type BrainNote } from "@/lib/types/brain";
import {
  BRAIN_KINDS,
  BRAIN_KIND_COLORS,
  BRAIN_KIND_LABELS,
  type BrainKind,
} from "@/lib/validation/brain-schemas";
import { cn } from "@/lib/utils";

export function BrainList({ notes }: { notes: BrainNote[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<BrainKind | null>(null);
  const [semester, setSemester] = useState<string | null>(null);

  const semesters = useMemo(
    () =>
      Array.from(new Set(notes.map((note) => note.semester).filter(Boolean) as string[])).sort(
        (a, b) => b.localeCompare(a),
      ),
    [notes],
  );

  const counts = useMemo(() => {
    const map = new Map<BrainKind, number>();
    for (const note of notes) map.set(note.kind, (map.get(note.kind) ?? 0) + 1);
    return map;
  }, [notes]);

  // Client-side filtering over what's on the page. The database's full-text
  // index is what the ask bar uses; here the whole list is already loaded and
  // a substring match is both faster and more forgiving while someone types.
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return notes.filter((note) => {
      if (kind && note.kind !== kind) return false;
      if (semester && note.semester !== semester) return false;
      if (!term) return true;
      return `${note.title} ${note.body}`.toLowerCase().includes(term);
    });
  }, [notes, query, kind, semester]);

  return (
    <div className="flex flex-col gap-[15px]">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-foreground/40" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search everything written down"
            className="w-full border border-line bg-background py-2.5 pr-3 pl-8.5 font-sans text-[13.5px] text-foreground placeholder:text-foreground/40 outline-none transition-[border-color] duration-200 ease-fluid hover:border-foreground/40 focus-visible:border-foreground"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {BRAIN_KINDS.map((value) => {
            const active = kind === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setKind(active ? null : value)}
                className={cn(
                  "t-eyebrow flex items-center gap-1.5 border px-2.5 py-1.5 transition-[background-color,border-color,color] duration-200 ease-fluid",
                  active
                    ? "border-foreground bg-mint text-foreground"
                    : "border-line bg-background text-subtle hover:border-foreground hover:text-foreground",
                )}
              >
                <span className="size-2" style={{ background: BRAIN_KIND_COLORS[value] }} />
                {BRAIN_KIND_LABELS[value]}
                <span className="text-foreground/50">{counts.get(value) ?? 0}</span>
              </button>
            );
          })}
          {semesters.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSemester(semester === value ? null : value)}
              className={cn(
                "t-eyebrow border px-2.5 py-1.5 transition-[background-color,border-color,color] duration-200 ease-fluid",
                semester === value
                  ? "border-foreground bg-mint text-foreground"
                  : "border-line bg-background text-subtle hover:border-foreground hover:text-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="border border-line bg-background px-4 py-8 text-center font-sans text-[13px] text-foreground/50 shadow-soft">
          Nothing written down that matches.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((note) => (
            <Link
              key={note.id}
              href={`/brain/${note.id}`}
              className="flex flex-col gap-1.5 border border-line bg-background p-4 shadow-soft transition-[box-shadow,transform,border-color] duration-300 ease-fluid hover:-translate-y-0.5 hover:border-foreground hover:shadow-mint-sm"
            >
              <div className="flex items-center gap-2">
                <span className="size-2 shrink-0" style={{ background: BRAIN_KIND_COLORS[note.kind] }} />
                <span className="min-w-0 flex-1 truncate font-sans text-[14px] font-medium text-foreground">
                  {note.title}
                </span>
                {note.source_url && <LinkIcon className="size-3 shrink-0 text-foreground/50" />}
                {note.visibility === "exec" && (
                  <span className="t-eyebrow shrink-0 border border-line px-2 py-0.5 text-foreground/50">
                    exec
                  </span>
                )}
              </div>

              {note.body.trim() && (
                <p className="font-sans text-[13px] leading-[1.7] text-subtle">
                  {preview(note.body)}
                </p>
              )}

              <span className="t-eyebrow text-foreground/50">
                {BRAIN_KIND_LABELS[note.kind]}
                {note.semester && ` · ${note.semester}`} ·{" "}
                {note.author?.full_name ?? note.author?.email ?? "the club"} ·{" "}
                {new Date(note.updated_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
