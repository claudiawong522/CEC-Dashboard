"use client";

import { useState } from "react";
import Link from "next/link";
import { STAGE_VALUES, STAGE_LABELS, type StageValue } from "@/lib/validation/external-schemas";
import { stageDotProps, isClosedStage } from "@/lib/utils/external-stage";
import { initials } from "@/lib/utils/initials";
import { DeleteIdeaDialog } from "@/components/external/DeleteIdeaDialog";
import { MoveToCrmButton } from "@/components/external/MoveToCrmButton";
import { crmContactId, type IdeaWithRelations, type AdminInfo } from "@/lib/types/external";

function StageTag({ stage }: { stage: StageValue }) {
  const dot = stageDotProps(stage);
  const isTerminal = stage === "declined" || stage === "converted";
  return (
    <span
      className={
        "t-eyebrow flex shrink-0 items-center gap-1.5 border px-2 py-0.5 " +
        (isTerminal ? "border-foreground bg-mint text-foreground" : "border-line text-subtle") +
        (stage === "declined" ? " border-red/40 bg-transparent text-red" : "")
      }
    >
      <span className={"size-1.5 shrink-0 " + dot.className} style={dot.style} />
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
      {/* On phones the stage chips are one row that scrolls sideways inside
          the page gutter rather than wrapping into a block of seven. */}
      <div className="-mx-4 flex w-[calc(100%+2rem)] gap-1.5 overflow-x-auto px-4 py-0.5 [scrollbar-width:none] sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible sm:px-0">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={
            "t-eyebrow flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 whitespace-nowrap transition-colors duration-200 ease-fluid max-md:min-h-11 max-md:px-3 " +
            (filter === "all" ? "border-foreground bg-foreground text-background" : "border-line text-foreground/50 hover:border-foreground hover:text-foreground")
          }
        >
          All
          <span className={filter === "all" ? "text-mint" : "text-foreground/40"}>{ideas.length}</span>
        </button>
        {STAGE_VALUES.map((stage) => {
          const count = ideas.filter((i) => i.stage === stage).length;
          const dot = stageDotProps(stage);
          const active = filter === stage;
          return (
            <button
              key={stage}
              type="button"
              onClick={() => setFilter(stage)}
              className={
                "t-eyebrow flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 whitespace-nowrap transition-colors duration-200 ease-fluid max-md:min-h-11 max-md:px-3 " +
                (active ? "border-foreground bg-foreground text-background" : "border-line text-foreground/50 hover:border-foreground hover:text-foreground")
              }
            >
              <span className={"size-1.5 shrink-0 " + dot.className} style={dot.style} />
              {STAGE_LABELS[stage]}
              <span className={active ? "text-mint" : "text-foreground/40"}>{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="border border-dashed border-line px-4 py-3.5 font-sans text-[13px] text-foreground/50">
          {ideas.length ? "Nothing at this stage." : "No leads yet. Add one above."}
        </div>
      ) : (
        <div className="flex flex-col border border-line bg-background shadow-soft">
          {visible.map((idea, i) => {
            const owners = idea.external_idea_owners
              .map((o) => adminsById[o.profile_id])
              .filter((a): a is AdminInfo => !!a);
            const closed = isClosedStage(idea.stage);
            // The first closed lead earns a divider, but only when live
            // leads sit above it; filtering down to just Declined shouldn't
            // label a list that is entirely closed.
            const startsClosedGroup = closed && i > 0 && !isClosedStage(visible[i - 1].stage);
            return (
              <div key={idea.id} className="contents">
                {startsClosedGroup && (
                  <div className="flex items-center gap-2.5 border-b border-line bg-muted px-3 py-1.5">
                    <span className="t-eyebrow text-foreground/50">
                      Closed
                    </span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                )}
                <div
                  className={
                    "group relative flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 transition-[background-color,box-shadow] duration-200 ease-fluid hover:bg-muted/40 hover:shadow-[inset_3px_0_0_0_var(--mint)] sm:flex-nowrap sm:py-[19px] " +
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
                      "pointer-events-none relative min-w-0 basis-full truncate font-sans text-[15px] font-medium sm:basis-auto sm:flex-1 " +
                      (closed ? "text-subtle" : "text-foreground")
                    }
                  >
                    {idea.pitch || "(untitled)"}
                  </span>
                  <span className="pointer-events-none relative shrink-0">
                    <StageTag stage={idea.stage} />
                  </span>
                  {/* The span itself stays click-through so an unowned lead
                      doesn't leave 72px of dead row, but each avatar takes
                      its pointer events back: they carry a `title` with the
                      owner's name, and that never fires without hover. */}
                  <span className="pointer-events-none relative ml-auto flex justify-end sm:ml-0 sm:min-w-[72px]">
                    {owners.map((o, j) => (
                      <span
                        key={j}
                        title={o.full_name ?? o.email}
                        style={{ marginLeft: j === 0 ? 0 : -7, boxShadow: "0 0 0 2px var(--white)" }}
                        className="pointer-events-auto relative flex size-[26px] items-center justify-center border-2 border-foreground bg-background font-display text-[9.5px] font-bold text-foreground"
                      >
                        {initials(o.full_name ?? o.email)}
                      </span>
                    ))}
                  </span>
                  <MoveToCrmButton
                    ideaId={idea.id}
                    contactId={crmContactId(idea.external_idea_people)}
                    className="relative shrink-0"
                  />
                  <DeleteIdeaDialog
                    ideaId={idea.id}
                    pitch={idea.pitch}
                    isConverted={idea.stage === "converted"}
                    className="relative opacity-100 transition-opacity duration-200 ease-fluid md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 max-md:-my-1.5"
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
