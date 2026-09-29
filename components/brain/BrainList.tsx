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
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search everything written down"
            className="w-full rounded-input border border-line-input bg-paper py-2.5 pr-3 pl-8.5 font-sans text-[13.5px] text-ink placeholder:text-faint outline-none transition-[border-color,box-shadow] duration-[220ms] focus-visible:border-strong focus-visible:ring-[3px] focus-visible:ring-[rgba(35,32,28,0.05)]"
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
                  "flex items-center gap-1.5 rounded-[20px] border px-[11px] py-[6px] font-mono text-[9.5px] tracking-[0.1em] uppercase transition-[background-color,border-color,color] duration-200 ease-brand",
                  active
                    ? "border-transparent bg-cent-tint text-ink"
                    : "border-line-input bg-paper text-body hover:border-[rgba(35,32,28,0.24)] hover:text-ink",
                )}
              >
                <span
                  className="size-[7px] rounded-full"
                  style={{ background: BRAIN_KIND_COLORS[value] }}
                />
                {BRAIN_KIND_LABELS[value]}
                <span className="text-faint">{counts.get(value) ?? 0}</span>
              </button>
            );
          })}
          {semesters.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSemester(semester === value ? null : value)}
              className={cn(
                "rounded-[20px] border px-[11px] py-[6px] font-mono text-[9.5px] tracking-[0.1em] uppercase transition-[background-color,border-color,color] duration-200 ease-brand",
                semester === value
                  ? "border-transparent bg-cent-tint text-ink"
                  : "border-line-input bg-paper text-body hover:border-[rgba(35,32,28,0.24)] hover:text-ink",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-card border border-[rgba(35,32,28,0.07)] bg-paper px-[15px] py-8 text-center font-sans text-[13px] text-faint">
          Nothing written down that matches.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((note) => (
            <Link
              key={note.id}
              href={`/brain/${note.id}`}
              className="flex flex-col gap-1.5 rounded-card border border-[rgba(35,32,28,0.07)] bg-paper p-[15px] transition-[background-color,border-color] duration-200 ease-brand hover:border-[rgba(35,32,28,0.14)] hover:bg-wash"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-[7px] shrink-0 rounded-full"
                  style={{ background: BRAIN_KIND_COLORS[note.kind] }}
                />
                <span className="min-w-0 flex-1 truncate font-sans text-[13.5px] font-medium text-ink">
                  {note.title}
                </span>
                {note.source_url && <LinkIcon className="size-3 shrink-0 text-faint" />}
                {note.visibility === "exec" && (
                  <span className="shrink-0 font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
                    exec
                  </span>
                )}
              </div>

              {note.body.trim() && (
                <p className="font-sans text-[12.5px] leading-[1.7] text-body">
                  {preview(note.body)}
                </p>
              )}

              <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
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
