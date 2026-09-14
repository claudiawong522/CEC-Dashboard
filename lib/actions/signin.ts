"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { actionFailed, actionOk, type ActionResult } from "@/lib/actions/result";
import { normalizeEmail, pickTodaysEvent, wallClockDate } from "@/lib/utils/signin-window";
import {
  pickQuestions,
  QUESTIONS_FOR_NEW,
  QUESTIONS_FOR_RETURNING,
  type SignInQuestion,
} from "@/lib/utils/signin-milestones";
import { signInSchema, type SignInInput } from "@/lib/validation/signin-schemas";
import type {
  CurrentEvent,
  GuestLookup,
  MissingProfile,
  SignInEventRow,
} from "@/lib/types/signin";

export type SignInResult = ActionResult & {
  firstName?: string;
  visitNumber?: number;
  alreadyToday?: boolean;
};

function databaseFailure(what: string, error: { message: string }): ActionResult {
  console.error(`[signin] couldn't ${what}:`, error.message);
  return actionFailed(`Couldn't ${what}, try again`);
}

// The whole public path runs on the service role, because `anon` has no grants
// and no policies on this project and that is worth keeping. The cost is that
// RLS is not guarding these functions, so the rule they follow is absolute:
// the event and the date are resolved here, from the server's own clock, and
// an event id coming from the browser is never trusted or even accepted.
async function resolveTodaysEvent(): Promise<SignInEventRow | null> {
  const admin = createAdminClient();
  const today = wallClockDate();

  const { data, error } = await admin
    .from("events")
    .select("id, name, venue, event_date, event_time, event_end_time, has_signin")
    .eq("has_signin", true)
    .eq("event_date", today)
    .returns<SignInEventRow[]>();

  if (error) {
    console.error("[signin] couldn't resolve today's event:", error.message);
    return null;
  }

  return pickTodaysEvent(data ?? []);
}

/**
 * What the public page prints at the top. Null is not an error state and does
 * not close the door: it means nobody put tonight on the calendar, and the
 * form still takes sign ins that /signins can attach afterwards.
 */
export async function getCurrentSignInEvent(): Promise<CurrentEvent> {
  const event = await resolveTodaysEvent();
  if (!event) return null;
  return { name: event.name, venue: event.venue };
}

async function questionBank(): Promise<SignInQuestion[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("signin_questions")
    .select("id, prompt, placeholder, audience")
    .eq("active", true)
    .returns<SignInQuestion[]>();

  if (error) {
    // A missing bank must never block a sign in. The form falls back to asking
    // nothing beyond the essentials.
    console.error("[signin] couldn't load the question bank:", error.message);
    return [];
  }
  return data ?? [];
}

type GuestProfileRow = {
  id: string;
  full_name: string;
  linkedin_url: string | null;
  affiliation: string | null;
  background: string | null;
};

// What is still blank on somebody's row. This, and not "are they new", is what
// the form asks for: the people who signed in while these fields were optional
// are returning guests with nothing on file, and the only way to ever fill
// that in is to ask them the next time they scan.
function missingProfile(guest: Partial<GuestProfileRow> | null): MissingProfile {
  return {
    linkedin: !guest?.linkedin_url?.trim(),
    affiliation: !guest?.affiliation?.trim(),
    background: !guest?.background?.trim(),
  };
}

/**
 * The email step, which is the whole branch of the form.
 *
 * Answers three things at once so the browser makes one round trip: do we know
 * this address, have they already signed in today, and what should they be
 * asked. Unauthenticated by necessity, so it is worth being precise about what
 * it discloses: a first name and a visit count, to somebody who has just typed
 * that person's address. It no longer refuses to answer outside an event
 * window, because there is no window any more.
 */
export async function lookupGuest(rawEmail: string): Promise<GuestLookup> {
  const empty: GuestLookup = {
    known: false,
    fullName: null,
    alreadyToday: false,
    visitNumber: 1,
    questions: [],
    missing: { linkedin: true, affiliation: true, background: true },
  };

  const email = normalizeEmail(rawEmail);
  if (!email || !email.includes("@")) return empty;

  const admin = createAdminClient();
  const today = wallClockDate();
  const bank = await questionBank();

  const { data: guest } = await admin
    .from("guests")
    .select("id, full_name, linkedin_url, affiliation, background")
    .eq("email", email)
    .maybeSingle<GuestProfileRow>();

  if (!guest) {
    return { ...empty, questions: pickQuestions(bank, "new", today, QUESTIONS_FOR_NEW) };
  }

  const { data: visits } = await admin
    .from("guest_signins")
    .select("signin_date, answers")
    .eq("guest_id", guest.id)
    .returns<{ signin_date: string; answers: Record<string, string> | null }[]>();

  const history = visits ?? [];
  const alreadyToday = history.some((row) => row.signin_date === today);

  // Everything this person has ever answered, so the bank hands them something
  // new each week and eventually runs out. A blank answer does not count as
  // asked: they skipped it, and it can come round again.
  const answered = new Set<string>();
  for (const visit of history) {
    for (const [id, answer] of Object.entries(visit.answers ?? {})) {
      if (answer?.trim()) answered.add(id);
    }
  }

  return {
    known: true,
    fullName: guest.full_name,
    alreadyToday,
    // Already in tonight: this *is* their nth visit. Otherwise it is the one
    // they are about to make.
    visitNumber: alreadyToday ? history.length : history.length + 1,
    questions: pickQuestions(bank, "returning", today, QUESTIONS_FOR_RETURNING, answered),
    missing: missingProfile(guest),
  };
}

export async function submitSignIn(input: SignInInput): Promise<SignInResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");

  const { fullName, linkedinUrl, affiliation, background, answers, source } = parsed.data;
  const email = normalizeEmail(parsed.data.email);
  const admin = createAdminClient();
  const today = wallClockDate();

  // What we already hold on them, which decides two things: whether this
  // submission is allowed to leave a required field blank, and whether their
  // form was right to have hidden it in the first place.
  const { data: existing } = await admin
    .from("guests")
    .select("id, full_name, linkedin_url, affiliation, background")
    .eq("email", email)
    .maybeSingle<GuestProfileRow>();

  // The one rule that makes these fields required at all. The form already
  // enforces it, but the form is a browser and this is not: a submission that
  // would leave somebody's row as blank as it started is refused here.
  const owed = missingProfile(existing);
  const stillMissing: string[] = [];
  if (owed.linkedin && !linkedinUrl) stillMissing.push("your LinkedIn");
  if (owed.affiliation && !affiliation) stillMissing.push("your year and major");
  if (owed.background && !background) stillMissing.push("what you're into");
  if (stillMissing.length > 0) {
    const last = stillMissing.pop() as string;
    const list = stillMissing.length ? `${stillMissing.join(", ")} and ${last}` : last;
    return actionFailed(`Add ${list} to sign in`);
  }

  // Null when nobody added the event. The sign in still lands, keyed to the
  // day, and /signins offers to attach it.
  const event = await resolveTodaysEvent();

  // A member typing their email here gets linked rather than duplicated. This
  // does not record member attendance: that stays on /attendance, which is a
  // decision rather than an oversight.
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle<{ id: string }>();

  const { data: guest, error: guestError } = await admin
    .from("guests")
    .upsert(
      {
        email,
        full_name: fullName,
        // A returning attendee is only shown the fields still blank on their
        // row, so everything they already told us arrives here empty. Blanks
        // are omitted from the update rather than written as nulls, or every
        // sign in would erase the visit before it.
        ...(linkedinUrl ? { linkedin_url: linkedinUrl } : {}),
        ...(affiliation ? { affiliation } : {}),
        ...(background ? { background } : {}),
        ...(profile ? { profile_id: profile.id } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    )
    .select("id")
    .single<{ id: string }>();

  if (guestError || !guest) {
    return databaseFailure("save your details", guestError ?? { message: "no guest row returned" });
  }

  // Only answers to questions that actually exist and are live get stored. The
  // browser is choosing the keys here, so without this the payload is an open
  // write into a jsonb column.
  const bank = await questionBank();
  const live = new Set(bank.map((q) => q.id));
  const cleanAnswers: Record<string, string> = {};
  for (const [id, answer] of Object.entries(answers ?? {})) {
    if (live.has(id) && answer) cleanAnswers[id] = answer;
  }

  // ignoreDuplicates is what enforces one sign in per day: a second scan, in
  // another tab or on the kiosk, matches the unique key on (guest, date) and
  // becomes a no-op rather than an error or a second visit.
  const { error: signinError } = await admin.from("guest_signins").upsert(
    {
      guest_id: guest.id,
      event_id: event?.id ?? null,
      signin_date: today,
      answers: cleanAnswers,
      source,
    },
    { onConflict: "guest_id,signin_date", ignoreDuplicates: true },
  );

  if (signinError) return databaseFailure("sign you in", signinError);

  const { count } = await admin
    .from("guest_signins")
    .select("id", { count: "exact", head: true })
    .eq("guest_id", guest.id);

  revalidatePath("/signins");
  revalidatePath("/leaderboard");
  return {
    ...actionOk(),
    firstName: fullName.split(" ")[0],
    visitNumber: count ?? 1,
  };
}

/** Members only. Turns the walk-in sign in on or off for one event. */
export async function setEventSignIn(eventId: string, enabled: boolean): Promise<ActionResult> {
  await requireRole("edit");

  const supabase = await createClient();
  const { error } = await supabase.from("events").update({ has_signin: enabled }).eq("id", eventId);
  if (error) return databaseFailure("update that event", error);

  revalidatePath("/signins");
  return actionOk();
}

/**
 * Attach a day's unattached sign ins to an event, for the night somebody
 * forgot to put it on the calendar. The sign ins themselves were never at
 * risk; this is only about which event they hang off afterwards.
 */
export async function attachSignInsToEvent(
  date: string,
  eventId: string,
): Promise<ActionResult> {
  await requireRole("edit");

  const supabase = await createClient();
  const { error } = await supabase
    .from("guest_signins")
    .update({ event_id: eventId })
    .eq("signin_date", date)
    .is("event_id", null);

  if (error) return databaseFailure("attach those sign ins", error);

  revalidatePath("/signins");
  return actionOk();
}
