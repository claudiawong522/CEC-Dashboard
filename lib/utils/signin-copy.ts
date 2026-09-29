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

// What the form says it still wants, on the step where it asks for it. The
// count is derived from the fields actually on screen rather than written into
// the copy, because the two drifted apart the moment the form started asking
// different people for different things: the kiosk was telling a returning
// guest "one question and you're done" above a form with no questions on it.
export function thingsLeft(count: number): string {
  if (count <= 1) return "One thing and you're done.";
  const words = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven"];
  return `${words[count] ?? count} quick things and you're done.`;
}
