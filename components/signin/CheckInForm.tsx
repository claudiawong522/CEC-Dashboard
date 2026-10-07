"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sticker } from "@/components/decor/Sticker";
import { Confetti } from "@/components/decor/shapes";
import { lookupGuest, submitSignIn } from "@/lib/actions/signin";
import { milestoneFor, visitLine, type SignInQuestion } from "@/lib/utils/signin-milestones";
import { thingsLeft } from "@/lib/utils/signin-copy";
import { normalizeLinkedIn } from "@/lib/utils/linkedin";
import type { CurrentEvent, MissingProfile } from "@/lib/types/signin";

// The person filling this in has no session and no account, so the email is
// the whole identity, and it is asked first and on its own. Everything after
// it depends on the answer: a returning attendee should never be handed a form
// asking things they have already told us.
type Step = "email" | "details" | "done";

// The address of whoever last signed in on this device, so a returning
// attendee taps rather than types. Never on the kiosk, which is shared.
const REMEMBERED = "cec.checkin.email";

const KIOSK_RESET_MS = 3000;

// Where the next one is. The confirmation screen is the only moment we have
// someone's attention with nothing left to ask them, and "when is the next
// one" is the question a first-timer actually leaves with. Luma already
// answers it and already handles the reminder email, so this hands off rather
// than rebuilding any of that here.
//
// lu.ma/cornellec is the live calendar. The old lu.ma/cornell-entrepreneurship
// slug 404s, and was hardcoded on the club site for a while before anyone
// noticed, so it is worth not reintroducing.
const LUMA_URL = "https://lu.ma/cornellec";

function UpcomingEventsLink() {
  return (
    <a
      href={LUMA_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="brutalist-border inline-flex items-center gap-2 bg-transparent px-4 py-2 font-display text-[12px] font-bold tracking-wide text-foreground uppercase transition-colors duration-200 ease-fluid hover:bg-foreground hover:text-background"
    >
      See what&rsquo;s coming up
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-[13px] w-[13px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 17L17 7M17 7H8M17 7v9" />
      </svg>
    </a>
  );
}

// Nobody we know: everything is owed.
const ALL_MISSING: MissingProfile = { linkedin: true, affiliation: true, background: true };

type Confirmation = { firstName: string; visitNumber: number; alreadyToday: boolean };

export function CheckInForm({ event, kiosk }: { event: CurrentEvent; kiosk: boolean }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [knownName, setKnownName] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [background, setBackground] = useState("");
  // Which standing fields this person still owes us. Everything starts owed,
  // which is the right default for somebody we have never seen.
  const [missing, setMissing] = useState<MissingProfile>(ALL_MISSING);
  const [questions, setQuestions] = useState<SignInQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [returning, setReturning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [isPending, startTransition] = useTransition();
  const emailInput = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("email");
    setEmail("");
    setFullName("");
    setKnownName(false);
    setLinkedinUrl("");
    setAffiliation("");
    setBackground("");
    setMissing(ALL_MISSING);
    setQuestions([]);
    setAnswers({});
    setReturning(false);
    setError(null);
    setConfirmation(null);
    emailInput.current?.focus();
  }

  // A shared laptop at the door must not sit there holding the last person's
  // name and email for whoever walks up next.
  useEffect(() => {
    if (!kiosk || step !== "done") return;
    const timer = setTimeout(reset, KIOSK_RESET_MS);
    return () => clearTimeout(timer);
  }, [kiosk, step]);

  // Their own phone remembers them, so the second week is one tap on Continue.
  useEffect(() => {
    if (kiosk) return;
    try {
      const remembered = window.localStorage.getItem(REMEMBERED);
      // localStorage cannot be read during render without a hydration
      // mismatch: the server has no idea what this device knows.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (remembered) setEmail(remembered);
    } catch {
      // Private browsing, or storage disabled. They type it, as before.
    }
  }, [kiosk]);

  function continueFromEmail() {
    const typed = email.trim();
    if (!typed.includes("@")) {
      setError("Enter your email to sign in");
      return;
    }
    setError(null);

    startTransition(async () => {
      const found = await lookupGuest(typed);

      // Already in tonight. A second scan, a new tab, a phone that lost the
      // page: same visit, same tick, nothing to fill in again.
      if (found.alreadyToday) {
        remember(typed);
        setConfirmation({
          firstName: (found.fullName ?? "").split(" ")[0] || "you",
          visitNumber: found.visitNumber,
          alreadyToday: true,
        });
        setStep("done");
        return;
      }

      const name = found.fullName;
      setReturning(found.known);
      if (name) setFullName(name);
      setKnownName(!!name);
      setMissing(found.missing);
      // The kiosk is a queue at a door. It still collects the standing facts,
      // which are asked once ever, but not the night's questions, which are
      // asked every week and are what turns a queue into a wait.
      const drawn = kiosk ? [] : found.questions;
      setQuestions(drawn);

      // Nothing left to ask: their row is complete and they have worked
      // through the bank, so the form has no business standing between them
      // and the tick. This is the intended end state for a regular, not an
      // edge case, and it is why the questions are per person.
      const nothingToAsk =
        !!name &&
        !found.missing.linkedin &&
        !found.missing.affiliation &&
        !found.missing.background &&
        drawn.length === 0;

      if (name && nothingToAsk) {
        const result = await submitSignIn({
          email: typed,
          fullName: name,
          source: kiosk ? "kiosk" : "qr",
        });

        if (!result.ok) {
          // Something the browser could not have known about. Show them the
          // form rather than a dead end.
          setError(result.message);
          setStep("details");
          return;
        }

        remember(typed);
        setConfirmation({
          firstName: result.firstName ?? name.split(" ")[0],
          visitNumber: result.visitNumber ?? found.visitNumber,
          alreadyToday: false,
        });
        setStep("done");
        return;
      }

      setStep("details");
    });
  }

  function remember(address: string) {
    if (kiosk) return;
    try {
      window.localStorage.setItem(REMEMBERED, address.trim().toLowerCase());
    } catch {
      // Nothing to do; the next visit asks for the address again.
    }
  }

  function submit() {
    if (!fullName.trim()) {
      setError("Enter your name");
      return;
    }
    // Required, in the order they appear on screen, so the message always
    // points at the first field somebody actually skipped.
    if (missing.linkedin) {
      if (!linkedinUrl.trim()) {
        setError("Add your LinkedIn to sign in");
        return;
      }
      if (!normalizeLinkedIn(linkedinUrl)) {
        setError("That doesn't look like a LinkedIn profile. Paste the link from your profile page.");
        return;
      }
    }
    if (missing.affiliation && !affiliation.trim()) {
      setError("Tell us your year and major, or what you do");
      return;
    }
    if (missing.background && !background.trim()) {
      setError("Tell us what you're into, a few words is plenty");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await submitSignIn({
        email,
        fullName,
        linkedinUrl,
        affiliation,
        background,
        answers,
        source: kiosk ? "kiosk" : "qr",
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      remember(email);
      setConfirmation({
        firstName: result.firstName ?? fullName.split(" ")[0],
        visitNumber: result.visitNumber ?? 1,
        alreadyToday: false,
      });
      setStep("done");
    });
  }

  // ---------------------------------------------------------------------------
  // Signed in. This screen is the whole reward, and the only thing anyone is
  // asked to show anybody, so it says who they are and how many nights they
  // have been coming. Food is not mentioned: it is open to everyone, and a
  // sign in screen that talks about food implies otherwise.
  // ---------------------------------------------------------------------------
  if (step === "done" && confirmation) {
    const milestone = milestoneFor(confirmation.visitNumber);

    if (milestone && !kiosk) {
      return (
        <div className="relative flex flex-col items-center gap-4 overflow-hidden border-2 border-foreground bg-background p-7 text-center shadow-mint">
          {/* The one bright element on the page: a mint band across the top,
              which is what makes this feel like an occasion. */}
          <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-mint" />

          <Sticker floatVariant="none" wrapperClassName="shrink-0">
            <Confetti />
          </Sticker>

          <div className="flex flex-col gap-2">
            <span className="t-eyebrow text-foreground/50">
              {confirmation.alreadyToday ? "already signed in" : "signed in"}
            </span>
            <p className="t-display text-[32px] text-foreground">
              {milestone.headline}
            </p>
            <p className="font-sans text-[15px] leading-[1.6] text-foreground">
              {confirmation.firstName}
            </p>
            <p className="mx-auto max-w-[34ch] font-sans text-[13.5px] leading-[1.75] text-subtle">
              {milestone.note}
            </p>
          </div>

          {confirmation.visitNumber > 1 && (
            <p className="font-sans text-[12.5px] leading-[1.7] text-foreground/50">
              Every night you turn up counts toward the leaderboard.
            </p>
          )}

          <UpcomingEventsLink />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2.5 border border-line bg-background p-5 shadow-soft">
        <span className="t-eyebrow text-foreground/50">
          {confirmation.alreadyToday ? "already signed in" : "signed in"}
        </span>
        <p className="t-display text-[28px] text-foreground">
          {kiosk ? "You're in." : `You're in, ${confirmation.firstName}.`}
        </p>
        <p className="font-sans text-[13.5px] leading-[1.75] text-subtle">
          {confirmation.alreadyToday
            ? `Signed in already tonight. Visit number ${confirmation.visitNumber}.`
            : visitLine(confirmation.visitNumber)}
        </p>
        {!kiosk && (
          <p className="font-sans text-[13px] leading-[1.7] text-foreground/50">
            Food&rsquo;s out for everyone, help yourself. Keep this page if you
            need to show you signed in.
          </p>
        )}

        {/* Not on the kiosk: that laptop is shared and resets in three
            seconds, so a link nobody has time to tap is just clutter, and it
            would open a browser tab on a machine at the door. */}
        {!kiosk && (
          <div className="pt-[3px]">
            <UpcomingEventsLink />
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // The form itself: email, then only what this particular person still owes us.
  // ---------------------------------------------------------------------------

  // A returning guest whose name we hold is never asked for it again, on the
  // kiosk either: the lookup already put it in state, and a box with your own
  // name in it is a question you cannot answer wrong or usefully.
  const showName = !knownName;
  // Counted off what is actually rendered below, so the copy cannot promise
  // "one question" above a form with none.
  const asking =
    (showName ? 1 : 0) +
    (missing.linkedin ? 1 : 0) +
    (missing.affiliation ? 1 : 0) +
    (missing.background ? 1 : 0) +
    questions.length;

  return (
    <div className="flex flex-col gap-4 border border-line bg-background p-5 shadow-soft">
      <div className="flex flex-col gap-1.5">
        <span className="t-eyebrow text-foreground/50">
          {event ? event.venue : "cornell entrepreneurship club"}
        </span>
        <p className="t-display text-[28px] text-foreground">
          {event ? event.name : "Startup Hours"}
        </p>
        <p className="font-sans text-[13.5px] leading-[1.75] text-subtle">
          {step === "email"
            ? "Sign in with your email. No account needed."
            : returning
              ? `Welcome back${fullName ? `, ${fullName.split(" ")[0]}` : ""}. ${thingsLeft(asking)}`
              : "Just a few things, then you're done."}
        </p>
      </div>

      {step === "email" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">
            Email
          </Label>
          <Input
            id="email"
            ref={emailInput}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") continueFromEmail();
            }}
            placeholder="you@example.com"
            className="py-3 text-[16px]"
          />
        </div>
      )}

      {step === "details" && (
        <>
          {/* A returning attendee already told us their name. Asking again is
              how a sign in starts feeling like paperwork. */}
          {showName && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fullName">
                Name
              </Label>
              <Input
                id="fullName"
                autoFocus
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ada Lovelace"
                className="py-3 text-[16px]"
              />
            </div>
          )}

          {/* The standing facts. Asked of anybody whose row is still blank,
              which includes regulars from the weeks when these were optional
              and therefore, almost without exception, empty. Each one is asked
              once ever: fill it in and no later sign in mentions it again. */}
          {missing.linkedin && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="linkedinUrl">
                LinkedIn
              </Label>
              <Input
                id="linkedinUrl"
                type="text"
                inputMode="url"
                autoFocus={!showName}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="linkedin.com/in/adalovelace"
                className="py-3 text-[16px]"
              />
              <span className="font-sans text-[11.5px] leading-[1.6] text-foreground/50">
                Your profile link, or just your handle.
              </span>
            </div>
          )}

          {missing.affiliation && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="affiliation">
                Year and major
              </Label>
              <Input
                id="affiliation"
                autoFocus={!showName && !missing.linkedin}
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                placeholder="CS '27, or where you work"
                className="py-3 text-[16px]"
              />
            </div>
          )}

          {missing.background && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="background">
                What are you into?
              </Label>
              <Textarea
                id="background"
                rows={2}
                autoFocus={!showName && !missing.linkedin && !missing.affiliation}
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="Building something in climate hardware, or just curious"
                className="text-[16px]"
              />
            </div>
          )}

          {/* Tonight's questions, drawn from the bank by audience and minus
              everything this person has already answered, so a regular works
              through the bank a couple at a time and eventually gets asked
              nothing. Optional, unlike the fields above: an unanswered one
              comes round again, a blank standing fact never does. */}
          {questions.map((question) => (
            <div key={question.id} className="flex flex-col gap-1.5">
              <Label
                htmlFor={`q-${question.id}`}
               
              >
                {question.prompt} <span className="text-foreground/50">(optional)</span>
              </Label>
              <Textarea
                id={`q-${question.id}`}
                rows={2}
                value={answers[question.id] ?? ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                }
                placeholder={question.placeholder ?? ""}
                className="text-[16px]"
              />
            </div>
          ))}
        </>
      )}

      {error && <p className="font-sans text-[12px] text-red">{error}</p>}

      <div className="flex items-center gap-4">
        <Button
          type="button"
          loading={isPending}
          onClick={step === "email" ? continueFromEmail : submit}
          className="px-5 py-3 text-[14px]"
        >
          {step === "email" ? "Continue" : "Sign in"}
        </Button>
        {step === "details" && !kiosk && (
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError(null);
            }}
            className="link-underline font-sans text-[12.5px] text-foreground/50 transition-colors duration-200 hover:text-foreground"
          >
            Wrong email?
          </button>
        )}
      </div>
    </div>
  );
}
