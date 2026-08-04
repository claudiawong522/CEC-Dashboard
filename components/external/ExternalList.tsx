"use client";

import { useState } from "react";
import Link from "next/link";
import { STAGE_VALUES, STAGE_LABELS, type StageValue } from "@/lib/validation/external-schemas";
import { stageDotProps, isClosedStage } from "@/lib/utils/external-stage";
import { initials } from "@/lib/utils/initials";
import { DeleteIdeaDialog } from "@/components/external/DeleteIdeaDialog";
import type { IdeaWithRelations, AdminInfo } from "@/lib/types/external";

function StageTag({ stage }: { stage: StageValue }) {
  const dot = stageDotProps(stage);
  const isTerminal = stage === "declined" || stage === "converted";
  return (
    <span
      className={
        "flex shrink-0 items-center gap-1.5 rounded-pill border px-[9px] py-1 font-mono text-[9.5px] tracking-[0.1em] uppercase " +
        (isTerminal ? "border-transparent bg-cent-tint text-ink" : "border-line-input text-body") +
        (stage === "declined" ? " border-destructive/25 bg-transparent text-destructive" : "")
      }
    >
      <span className={"size-1.5 shrink-0 rounded-full " + dot.className} style={dot.style} />
      {STAGE_LABELS[stage]}
    </span>
  );
}

export function ExternalList({
  ideas,
  adminsById,
}: {
  ideas: IdeaWithRelations[];
  adminsById: Record<string, AdminInfo>;
}) {
  const [filter, setFilter] = useState<StageValue | "all">("all");

  const visible = filter === "all" ? ideas : ideas.filter((i) => i.stage === filter);

  return (
    <div className="relative z-10 flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={
            "flex items-center gap-1.5 rounded-pill border px-3 py-1.5 font-mono text-[9.5px] tracking-[0.08em] uppercase transition-colors duration-200 ease-brand " +
            (filter === "all" ? "border-ink bg-ink text-page" : "border-line-input text-faint hover:border-[rgba(35,32,28,0.24)] hover:text-ink")
          }
        >
          All
          <span className={filter === "all" ? "text-page/65" : "text-faint"}>{ideas.length}</span>
        </button>
        {STAGE_VALUES.map((stage) => {
          const count = ideas.filter((i) => i.stage === stage).length;
          const dot = stageDotProps(stage);
          const active = filter === stage;
          return (
            <button
              key={stage}
              onClick={() => setFilter(stage)}
              className={
                "flex items-center gap-1.5 rounded-pill border px-3 py-1.5 font-mono text-[9.5px] tracking-[0.08em] uppercase transition-colors duration-200 ease-brand " +
                (active ? "border-ink bg-ink text-page" : "border-line-input text-faint hover:border-[rgba(35,32,28,0.24)] hover:text-ink")
              }
            >
              <span className={"size-1.5 shrink-0 rounded-full " + dot.className} style={dot.style} />
              {STAGE_LABELS[stage]}
              <span className={active ? "text-page/65" : "text-faint"}>{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-input px-4 py-3.5 font-sans text-[12.5px] text-faint">
          {ideas.length ? "Nothing at this stage." : "No leads yet — add one above."}
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-card border border-line bg-paper">
          {visible.map((idea, i) => {
            const owners = idea.external_idea_owners
              .map((o) => adminsById[o.profile_id])
              .filter((a): a is AdminInfo => !!a);
            const closed = isClosedStage(idea.stage);
            // The first closed lead earns a divider, but only when live
            // leads sit above it — filtering down to just Declined shouldn't
            // label a list that is entirely closed.
            const startsClosedGroup = closed && i > 0 && !isClosedStage(visible[i - 1].stage);
            return (
              <div key={idea.id} className="contents">
                {startsClosedGroup && (
                  <div className="flex items-center gap-2.5 border-b border-line bg-wash px-3 py-1.5">
                    <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
                      Closed
                    </span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                )}
                <div
                  className={
                    "group relative flex items-center gap-4 px-3 py-[19px] transition-colors duration-200 ease-brand hover:bg-wash " +
                    (i < visible.length - 1 ? "border-b border-line" : "")
                  }
                >
                  <Link
                    href={`/external/${idea.id}`}
                    aria-label={idea.pitch || "Untitled lead"}
                    className="absolute inset-0"
                  />
                  <span
                    className={
                      "pointer-events-none relative flex-1 truncate font-sans text-[15px] " +
                      (closed ? "text-body" : "text-ink")
                    }
                  >
                    {idea.pitch || "(untitled)"}
                  </span>
                  <span className="pointer-events-none relative shrink-0">
                    <StageTag stage={idea.stage} />
                  </span>
                  {/* The span itself stays click-through so an unowned lead
                      doesn't leave 72px of dead row, but each avatar takes
                      its pointer events back — they carry a `title` with the
                      owner's name, and that never fires without hover. */}
                  <span className="pointer-events-none relative flex min-w-[72px] justify-end">
                    {owners.map((o, j) => (
                      <span
                        key={j}
                        title={o.full_name ?? o.email}
                        style={{ marginLeft: j === 0 ? 0 : -7, boxShadow: "0 0 0 2px var(--page)" }}
                        className="pointer-events-auto relative flex size-[26px] items-center justify-center rounded-full bg-wash font-mono text-[9.5px] text-strong"
                      >
                        <span className="pointer-events-none absolute -inset-[1.5px] rounded-full bg-cent-pastel p-[1.5px] opacity-75 [mask-composite:exclude] [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)]" />
                        {initials(o.full_name ?? o.email)}
                      </span>
                    ))}
                  </span>
                  <DeleteIdeaDialog
                    ideaId={idea.id}
                    pitch={idea.pitch}
                    isConverted={idea.stage === "converted"}
                    className="relative opacity-100 transition-opacity duration-200 ease-brand md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
