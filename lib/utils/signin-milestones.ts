// What the confirmation screen says back to someone, and which questions they
// get asked. Both are pure, both are the bits worth being certain about, so
// both are here rather than inline in a component.

export type SignInQuestion = {
  id: string;
  prompt: string;
  placeholder: string | null;
  audience: "new" | "returning" | "both";
};

// Turning up repeatedly is the behaviour the leaderboard exists to reward, so
// the counts that earn a shout-out are the ones a person can plausibly reach
// in a semester. Startup Hours runs most weeks: 10 is a near-perfect record
// and 20 is two years of showing up.
const MILESTONES = [3, 5, 10, 15, 20, 25, 30];

export type Milestone = { visit: number; headline: string; note: string } | null;

/**
 * The moment worth marking, or null for an ordinary visit. Only exact hits
 * count: "your 5th" on a sixth visit is worse than saying nothing.
 */
export function milestoneFor(visitNumber: number): Milestone {
  if (visitNumber === 1) {
    return {
      visit: 1,
      headline: "First one down",
      note: "Welcome to Startup Hours. Food's out, help yourself, and come find whoever's running tonight.",
    };
  }

  if (!MILESTONES.includes(visitNumber)) return null;

  const notes: Record<number, string> = {
    3: "Three nights in. You're a regular now.",
    5: "Five nights. That's a real streak, and it's climbing the leaderboard.",
    10: "Ten nights. Genuinely one of the most consistent people here.",
    15: "Fifteen. At this point you know more of the room than we do.",
    20: "Twenty nights at Startup Hours. That's remarkable.",
    25: "Twenty-five. We should probably be paying you.",
    30: "Thirty nights. You are Startup Hours at this point.",
  };

  return {
    visit: visitNumber,
    headline: `Visit ${visitNumber}`,
    note: notes[visitNumber] ?? `${visitNumber} nights here.`,
  };
}

/** The ordinary line, for a visit that isn't a milestone. */
export function visitLine(visitNumber: number): string {
  if (visitNumber === 1) return "First time here.";
  if (visitNumber === 2) return "Second time. Good to see you back.";
  return `Visit number ${visitNumber}. Good to see you back.`;
}

// A tiny string hash. Not cryptographic and does not need to be: it exists so
// the pick below is stable rather than unpredictable.
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Which questions tonight asks this person.
 *
 * Two rules, and the order they are applied in is the whole design.
 *
 * Nothing already answered is ever asked again. A regular works through the
 * bank a couple of questions at a time and then, having answered all of it,
 * is asked nothing and signs in on one tap. That is the intended end state,
 * not a degenerate one: the reward for turning up every week is a form that
 * gets shorter, and the bank grows when there is something new worth asking.
 *
 * What is left is ordered by a hash of the date, so the people who walk in on
 * the same night with the same questions still owing get them in the same
 * order, and the host's board reads as one conversation rather than a pile of
 * unrelated ones. Change the bank and tomorrow reshuffles; nobody's night
 * changes under them mid-event.
 */
export function pickQuestions(
  bank: SignInQuestion[],
  audience: "new" | "returning",
  seed: string,
  count: number,
  /** Question ids this person has already answered, on any past visit. */
  answered: ReadonlySet<string> = new Set(),
): SignInQuestion[] {
  const eligible = bank.filter(
    (q) => (q.audience === audience || q.audience === "both") && !answered.has(q.id),
  );

  return [...eligible]
    .sort((a, b) => hash(seed + a.id) - hash(seed + b.id))
    .slice(0, count);
}

// How many to ask per visit. A first-timer is already handing over a name, a
// LinkedIn and what they are into, so two on top of that is the ceiling.
// Someone returning owes none of that and can spare the same two, which is
// what works a regular through the bank in a few weeks rather than a year.
export const QUESTIONS_FOR_NEW = 2;
export const QUESTIONS_FOR_RETURNING = 2;
