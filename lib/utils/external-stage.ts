import { STAGES, type StageValue } from "@/lib/validation/external-schemas";

// A lead is "closed" once it has stopped moving through the pipeline —
// either it became an event or it fell through. Both sink below the live
// leads in the list.
export function isClosedStage(stage: StageValue) {
  return stage === "converted" || stage === "declined";
}

// Sort rank: furthest along the pipeline first, so whatever is closest to
// becoming a real event sits at the top and the untouched ideas trail it.
// Converted then declined bring up the rear.
const STAGE_RANK: Record<StageValue, number> = {
  date_set: 0,
  agreed: 1,
  responded: 2,
  reached_out: 3,
  idea: 4,
  converted: 5,
  declined: 6,
};

// Same comparator wherever leads are listed — rank first, newest first
// inside a rank so a freshly added lead surfaces above its stage-mates.
// created_at is compared with < / > rather than localeCompare: these are
// fixed-shape UTC ISO strings, and locale collation is free to treat the
// punctuation in them as ignorable, which would silently scramble ties.
export function sortIdeas<T extends { stage: StageValue; created_at: string }>(ideas: T[]): T[] {
  return [...ideas].sort((a, b) => {
    const byStage = STAGE_RANK[a.stage] - STAGE_RANK[b.stage];
    if (byStage !== 0) return byStage;
    if (a.created_at === b.created_at) return 0;
    return a.created_at > b.created_at ? -1 : 1;
  });
}

// Declined/Converted are outcomes, not pipeline positions, so they get a
// fixed color rather than a place on the coral intensity ramp the 5 forward
// stages use — the ramp is what makes "how far along" scannable at a glance.
export function stageDotProps(stage: StageValue): { className: string; style?: React.CSSProperties } {
  if (stage === "declined") return { className: "bg-destructive" };
  if (stage === "converted") return { className: "bg-cent-pastel" };
  const idx = STAGES.indexOf(stage as (typeof STAGES)[number]);
  const opacity = 0.3 + (idx / (STAGES.length - 1)) * 0.7;
  return { className: "bg-coral", style: { opacity } };
}
