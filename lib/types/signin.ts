import type { SignInQuestion } from "@/lib/utils/signin-milestones";

// What the browser is allowed to know about tonight. Deliberately no event id:
// the public form has no use for one, and not sending it is what makes it
// impossible for a tampered form to send one back. The sign in works whether
// or not this is null, because somebody forgetting to put the event on the
// calendar must not stop the door working.
export type CurrentEvent = {
  name: string;
  venue: string;
} | null;

// Which of the standing fields this person still owes us. Computed from their
// guests row rather than from whether they are new, because the two are not
// the same thing: everyone who signed in while these were optional is a
// returning guest with nothing on file, and they get asked next time they
// scan rather than being written off.
export type MissingProfile = {
  linkedin: boolean;
  affiliation: boolean;
  background: boolean;
};

// The answer to "have I seen this address before", which is the whole branch
// the form turns on after the email step.
export type GuestLookup = {
  known: boolean;
  fullName: string | null;
  /** Already signed in today: there is nothing left to ask, show the tick. */
  alreadyToday: boolean;
  /** Which visit this is, or would be. Drives the milestone screen. */
  visitNumber: number;
  /** Tonight's questions for this person, minus everything they have answered. */
  questions: SignInQuestion[];
  /** The standing fields still blank on their row. */
  missing: MissingProfile;
};

// One person on the host's live list.
export type SignInBoardRow = {
  signinId: string;
  guestId: string;
  fullName: string;
  email: string;
  /** The standing facts off their guests row, which is the point of asking. */
  linkedinUrl: string | null;
  affiliation: string | null;
  background: string | null;
  answers: { prompt: string; answer: string }[];
  source: "qr" | "kiosk";
  signedInAt: string;
  visitNumber: number;
  isMember: boolean;
};

export type SignInEventRow = {
  id: string;
  name: string;
  venue: string;
  event_date: string;
  event_time: string;
  event_end_time: string | null;
  has_signin: boolean;
};

// One row of the semester leaderboard.
export type LeaderboardRow = {
  guestId: string;
  fullName: string;
  visits: number;
  lastSeen: string;
  isMember: boolean;
};
