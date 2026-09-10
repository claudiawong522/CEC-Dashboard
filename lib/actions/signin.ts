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
import type { CurrentEvent, GuestLookup, SignInEventRow } from "@/lib/types/signin";

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
  };

  const email = normalizeEmail(rawEmail);
  if (!email || !email.includes("@")) return empty;

  const admin = createAdminClient();
  const today = wallClockDate();
  const bank = await questionBank();

  const { data: guest } = await admin
    .from("guests")
    .select("id, full_name")
    .eq("email", email)
    .maybeSingle<{ id: string; full_name: string }>();

  if (!guest) {
    return { ...empty, questions: pickQuestions(bank, "new", today, QUESTIONS_FOR_NEW) };
  }

  const { data: visits } = await admin
    .from("guest_signins")
    .select("signin_date")
    .eq("guest_id", guest.id)
    .returns<{ signin_date: string }[]>();

  const history = visits ?? [];
  const alreadyToday = history.some((row) => row.signin_date === today);

  return {
    known: true,
    fullName: guest.full_name,
    alreadyToday,
    // Already in tonight: this *is* their nth visit. Otherwise it is the one
    // they are about to make.
    visitNumber: alreadyToday ? history.length : history.length + 1,
    questions: pickQuestions(bank, "returning", today, QUESTIONS_FOR_RETURNING),
  };
}

export async function submitSignIn(input: SignInInput): Promise<SignInResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");

  const { fullName, linkedinUrl, background, answers, source } = parsed.data;
  const email = normalizeEmail(parsed.data.email);
  const admin = createAdminClient();
  const today = wallClockDate();

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
        // A returning attendee whose form skipped the optional fields must not
        // have last time's answers wiped, so blanks are omitted from the
        // update rather than written as nulls.
        ...(linkedinUrl ? { linkedin_url: linkedinUrl } : {}),
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
