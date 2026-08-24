// What the browser is allowed to know about tonight's event. Deliberately no
// id: the public form has no use for one, and not sending it is what makes it
// impossible for a tampered form to send one back.
export type CurrentEvent = { name: string; venue: string };

export type GuestLookup = { known: boolean; fullName: string | null };

// One person on the host's live list.
export type SignInBoardRow = {
  signinId: string;
  guestId: string;
  fullName: string;
  email: string;
  wantsToMeet: string | null;
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
