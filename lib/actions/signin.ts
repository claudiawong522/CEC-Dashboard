"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { actionFailed, actionOk, type ActionResult } from "@/lib/actions/result";
import {
  foodOpensMinutes,
  foodState,
  normalizeEmail,
  pickCurrentEvent,
  wallClockDate,
  wallClockNow,
} from "@/lib/utils/signin-window";
import { signInSchema, type SignInInput } from "@/lib/validation/signin-schemas";
import type { CurrentEvent, GuestLookup, SignInEventRow } from "@/lib/types/signin";

export type SignInResult = ActionResult & { firstName?: string; visitNumber?: number };

function databaseFailure(what: string, error: { message: string }): ActionResult {
  console.error(`[signin] couldn't ${what}:`, error.message);
  return actionFailed(`Couldn't ${what}, try again`);
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// The whole public path runs on the service role, because `anon` has no grants
// and no policies on this project and that is worth keeping. The cost is that
// RLS is not guarding these functions, so the rule they follow is absolute:
// the event is resolved here, from the clock, and an event id coming from the
// browser is never trusted or even accepted.
async function resolveCurrentEvent(): Promise<SignInEventRow | null> {
  const admin = createAdminClient();
  const today = wallClockDate();

  // Yesterday through tomorrow covers a window that runs past midnight and any
  // disagreement between the server's date and Ithaca's.
  const { data, error } = await admin
    .from("events")
    .select("id, name, venue, event_date, event_time, event_end_time, food_opens_at, has_signin")
    .eq("has_signin", true)
    .gte("event_date", shiftDate(today, -1))
    .lte("event_date", shiftDate(today, 1))
    .returns<SignInEventRow[]>();

  if (error) {
    console.error("[signin] couldn't resolve tonight's event:", error.message);
    return null;
  }

  return pickCurrentEvent(data ?? [], wallClockNow());
}

export async function getCurrentSignInEvent(): Promise<CurrentEvent | null> {
  const event = await resolveCurrentEvent();
  if (!event) return null;
  // Only what the poster on the door already says, plus when food lands, which
  // is the one thing everyone in the room wants to know.
  return {
    name: event.name,
    venue: event.venue,
    foodOpensAt: minutesToClock(foodOpensMinutes(event)),
    foodIsOpen: wallClockNow() >= foodOpensMinutes(event),
  };
}

/** "20:15" for a display clock, from the epoch-minute units used internally. */
function minutesToClock(minutes: number): string {
  const intoDay = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(intoDay / 60);
  const m = intoDay % 60;
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${String(m).padStart(2, "0")}${h < 12 ? "am" : "pm"}`;
}

export type FoodResult =
  | { status: "collected"; firstName: string; visitNumber: number }
  | { status: "already"; at: string }
  | { status: "not_yet"; opensAt: string }
  | { status: "not_signed_in" }
  | { status: "closed" }
  | { status: "error"; message: string };

/**
 * The second scan. Runs on the service role like the sign in, because the
 * person holding the phone has no account.
 *
 * Everything is decided server side from the event row and their own sign in
 * time. The browser sends an address and nothing else.
 */
export async function claimFood(rawEmail: string): Promise<FoodResult> {
  const email = normalizeEmail(rawEmail);
  if (!email.includes("@")) return { status: "not_signed_in" };

  const event = await resolveCurrentEvent();
  if (!event) return { status: "closed" };

  const admin = createAdminClient();
  const { data: guest } = await admin
    .from("guests")
    .select("id, full_name")
    .eq("email", email)
    .maybeSingle<{ id: string; full_name: string }>();

  if (!guest) return { status: "not_signed_in" };

  const { data: signin } = await admin
    .from("guest_signins")
    .select("id, signed_in_at, food_claimed_at")
    .eq("guest_id", guest.id)
    .eq("event_id", event.id)
    .maybeSingle<{ id: string; signed_in_at: string; food_claimed_at: string | null }>();

  if (!signin) return { status: "not_signed_in" };
  if (signin.food_claimed_at) {
    return { status: "already", at: clockFromIso(signin.food_claimed_at) };
  }

  const state = foodState(event, wallClockNow(new Date(signin.signed_in_at)), wallClockNow());
  if (state.status === "not_yet") {
    return { status: "not_yet", opensAt: minutesToClock(state.opensAt) };
  }
  if (state.status === "too_late") return { status: "not_signed_in" };

  // `is null` is what makes a double tap safe: the second attempt matches no
  // rows rather than overwriting the first claim's timestamp.
  const { data: claimed, error } = await admin
    .from("guest_signins")
    .update({ food_claimed_at: new Date().toISOString() })
    .eq("id", signin.id)
    .is("food_claimed_at", null)
    .select("id");

  if (error) {
    console.error("[signin] couldn't record a food claim:", error.message);
    return { status: "error", message: "Couldn't do that, show this to a host" };
  }
  if (!claimed?.length) return { status: "already", at: "just now" };

  const { count } = await admin
    .from("guest_signins")
    .select("id", { count: "exact", head: true })
    .eq("guest_id", guest.id);

  revalidatePath("/signins");
  return {
    status: "collected",
    firstName: guest.full_name.split(" ")[0],
    visitNumber: count ?? 1,
  };
}

function clockFromIso(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })
    .toLowerCase()
    .replace(" ", "");
}

/** A host marking someone fed, or undoing it. Phones die. */
export async function setFoodClaimed(
  signinId: string,
  claimed: boolean,
): Promise<ActionResult> {
  const session = await requireRole("edit");

  const supabase = await createClient();
  const { error } = await supabase
    .from("guest_signins")
    .update(
      claimed
        ? { food_claimed_at: new Date().toISOString(), food_claimed_by: session.profile.id }
        : { food_claimed_at: null, food_claimed_by: null },
    )
    .eq("id", signinId);

  if (error) return databaseFailure(claimed ? "mark them fed" : "undo that", error);

  revalidatePath("/signins");
  return actionOk();
}

/**
 * Does this email already belong to someone who has signed in before? Used to
 * skip a returning attendee straight past the questions they have already
 * answered.
 *
 * This is unauthenticated, so it does technically answer "is this address
 * known to the club". It answers at all only while a sign in window is open,
 * which bounds that to a few hours a week, and the answer is a first name the
 * person typing the address already knows.
 */
export async function lookupGuest(rawEmail: string): Promise<GuestLookup> {
  const email = normalizeEmail(rawEmail);
  if (!email || !email.includes("@")) return { known: false, fullName: null };
  if (!(await resolveCurrentEvent())) return { known: false, fullName: null };

  const admin = createAdminClient();
  const { data } = await admin
    .from("guests")
    .select("full_name")
    .eq("email", email)
    .maybeSingle<{ full_name: string }>();

  return { known: !!data, fullName: data?.full_name ?? null };
}

export async function submitSignIn(input: SignInInput): Promise<SignInResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");

  const event = await resolveCurrentEvent();
  if (!event) return actionFailed("Sign in isn't open right now");

  const { fullName, linkedinUrl, background, wantsToMeet, source } = parsed.data;
  const email = normalizeEmail(parsed.data.email);
  const admin = createAdminClient();

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

  // ignoreDuplicates turns a double tap into a no-op rather than an error, the
  // same way taking attendance does.
  const { error: signinError } = await admin.from("guest_signins").upsert(
    { guest_id: guest.id, event_id: event.id, wants_to_meet: wantsToMeet, source },
    { onConflict: "guest_id,event_id", ignoreDuplicates: true },
  );

  if (signinError) return databaseFailure("sign you in", signinError);

  const { count } = await admin
    .from("guest_signins")
    .select("id", { count: "exact", head: true })
    .eq("guest_id", guest.id);

  revalidatePath("/signins");
  return { ...actionOk(), firstName: fullName.split(" ")[0], visitNumber: count ?? 1 };
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
