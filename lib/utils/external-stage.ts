import { STAGES, type StageValue } from "@/lib/validation/external-schemas";

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
