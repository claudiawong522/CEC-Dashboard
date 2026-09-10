// The headcount on the sign in board is already rendered as a large number
// beside this line, so this must describe the makeup of the room rather than
// restate the count. "1" above "1 first-timer" reads as two different numbers
// that happen to agree, which is what this exists to avoid.
export function composition(total: number, newcomers: number): string {
  if (total === 0) return "nobody yet";
  if (newcomers === 0) return "all returning";
  if (newcomers === total) return total === 1 ? "first time here" : "all first time";
  return `${newcomers} first-timer${newcomers === 1 ? "" : "s"}`;
}
