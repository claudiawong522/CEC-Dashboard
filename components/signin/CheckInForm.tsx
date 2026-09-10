"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sticker } from "@/components/stickers/Sticker";
import { Confetti } from "@/components/stickers/shapes";
import { lookupGuest, submitSignIn } from "@/lib/actions/signin";
import { milestoneFor, visitLine, type SignInQuestion } from "@/lib/utils/signin-milestones";
import type { CurrentEvent } from "@/lib/types/signin";

// The person filling this in has no session and no account, so the email is
// the whole identity, and it is asked first and on its own. Everything after
// it depends on the answer: a returning attendee should never be handed a form
// asking things they have already told us.
type Step = "email" | "details" | "done";

// The address of whoever last signed in on this device, so a returning
// attendee taps rather than types. Never on the kiosk, which is shared.
const REMEMBERED = "cec.checkin.email";

const KIOSK_RESET_MS = 3000;

type Confirmation = { firstName: string; visitNumber: number; alreadyToday: boolean };

export function CheckInForm({ event, kiosk }: { event: CurrentEvent; kiosk: boolean }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [background, setBackground] = useState("");
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
    setLinkedinUrl("");
    setBackground("");
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

      setReturning(found.known);
      if (found.fullName) setFullName(found.fullName);
      // The kiosk is a queue at a door: it asks for a name and nothing else.
      setQuestions(kiosk ? [] : found.questions);
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
    setError(null);

    startTransition(async () => {
      const result = await submitSignIn({
        email,
        fullName,
        linkedinUrl,
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
        <div className="relative flex flex-col items-center gap-[15px] overflow-hidden rounded-[14px] border border-[rgba(35,32,28,0.1)] bg-paper p-[27px] text-center">
          {/* The one bright element on the page, per the kit: the CENT gradient,
              here as the band that makes this feel like an occasion. */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ background: "var(--cent)" }}
          />

          <Sticker floatVariant="none" wrapperClassName="shrink-0">
            <Confetti />
          </Sticker>

          <div className="flex flex-col gap-[7px]">
            <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
              {confirmation.alreadyToday ? "already signed in" : "signed in"}
            </span>
            <p className="font-sans text-[31px] leading-[1.15] font-medium tracking-[-0.024em] text-ink">
              {milestone.headline}
            </p>
            <p className="font-sans text-[15px] leading-[1.6] text-ink">
              {confirmation.firstName}
            </p>
            <p className="mx-auto max-w-[34ch] font-sans text-[13.5px] leading-[1.75] text-body">
              {milestone.note}
            </p>
          </div>

          {confirmation.visitNumber > 1 && (
            <p className="font-sans text-[12.5px] leading-[1.7] text-faint">
              Every night you turn up counts toward the leaderboard.
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-[9px] rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper p-[19px]">
        <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
          {confirmation.alreadyToday ? "already signed in" : "signed in"}
        </span>
        <p className="font-sans text-[23px] leading-[1.3] font-medium tracking-[-0.02em] text-ink">
          {kiosk ? "You're in." : `You're in, ${confirmation.firstName}.`}
        </p>
        <p className="font-sans text-[13.5px] leading-[1.75] text-body">
          {confirmation.alreadyToday
            ? `Signed in already tonight. Visit number ${confirmation.visitNumber}.`
            : visitLine(confirmation.visitNumber)}
        </p>
        {!kiosk && (
          <p className="font-sans text-[13px] leading-[1.7] text-faint">
            Food&rsquo;s out for everyone, help yourself. Keep this page if you
            need to show you signed in.
          </p>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // The form itself: email, then only what this particular person still owes us.
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-[15px] rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper p-[19px]">
      <div className="flex flex-col gap-[5px]">
        <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
          {event ? event.venue : "cornell entrepreneurship club"}
        </span>
        <p className="font-sans text-[23px] leading-[1.3] font-medium tracking-[-0.02em] text-ink">
          {event ? event.name : "Startup Hours"}
        </p>
        <p className="font-sans text-[13.5px] leading-[1.75] text-body">
          {step === "email"
            ? "Sign in with your email. No account needed."
            : returning
              ? `Welcome back${fullName ? `, ${fullName.split(" ")[0]}` : ""}. One question and you're done.`
              : "Just a couple of things, then you're done."}
        </p>
      </div>

      {step === "email" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="font-sans text-[12px] font-normal text-body">
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
          {/* A returning attendee already told us their name and background.
              Asking again is how a sign in starts feeling like paperwork. */}
          {(!returning || kiosk) && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fullName" className="font-sans text-[12px] font-normal text-body">
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

          {!returning && !kiosk && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="linkedinUrl" className="font-sans text-[12px] font-normal text-body">
                  LinkedIn <span className="text-faint">(optional)</span>
                </Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  inputMode="url"
                  autoCapitalize="none"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/…"
                  className="py-3 text-[16px]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="background" className="font-sans text-[12px] font-normal text-body">
                  What are you into? <span className="text-faint">(optional)</span>
                </Label>
                <Textarea
                  id="background"
                  rows={2}
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="CS junior, building something in climate hardware"
                  className="text-[16px]"
                />
              </div>
            </>
          )}

          {/* Tonight's questions, drawn from the bank by audience. Everyone who
              walks in on the same night gets the same ones, so the answers read
              down the host's board as one conversation. */}
          {questions.map((question) => (
            <div key={question.id} className="flex flex-col gap-1.5">
              <Label
                htmlFor={`q-${question.id}`}
                className="font-sans text-[12px] font-normal text-body"
              >
                {question.prompt} <span className="text-faint">(optional)</span>
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

      {error && <p className="font-sans text-[12px] text-destructive">{error}</p>}

      <div className="flex items-center gap-[14px]">
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
            className="font-sans text-[12.5px] text-faint transition-colors duration-200 hover:text-ink"
          >
            Wrong email?
          </button>
        )}
      </div>
    </div>
  );
}
