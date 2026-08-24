"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { lookupGuest, submitSignIn } from "@/lib/actions/signin";
import type { CurrentEvent } from "@/lib/types/signin";

// Fields the person filling this in has no session and no account, so the
// email is the whole identity. Everything stable about them is asked once,
// ever; the per-night question is asked every time.
type Step = "email" | "details" | "done";

const KIOSK_RESET_MS = 2500;

export function CheckInForm({ event, kiosk }: { event: CurrentEvent; kiosk: boolean }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [background, setBackground] = useState("");
  const [wantsToMeet, setWantsToMeet] = useState("");
  const [returning, setReturning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ firstName: string; visitNumber: number } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const emailInput = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("email");
    setEmail("");
    setFullName("");
    setLinkedinUrl("");
    setBackground("");
    setWantsToMeet("");
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

  function continueFromEmail() {
    const typed = email.trim();
    if (!typed.includes("@")) {
      setError("Enter your email to sign in");
      return;
    }
    setError(null);

    // Kiosk mode never asks the long questions, so there is nothing to skip
    // and no reason to make someone at a queue wait on a round trip.
    if (kiosk) {
      setStep("details");
      return;
    }

    startTransition(async () => {
      const found = await lookupGuest(typed);
      setReturning(found.known);
      if (found.fullName) setFullName(found.fullName);
      setStep("details");
    });
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
        wantsToMeet,
        source: kiosk ? "kiosk" : "qr",
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setConfirmation({
        firstName: result.firstName ?? fullName.split(" ")[0],
        visitNumber: result.visitNumber ?? 1,
      });
      setStep("done");
    });
  }

  if (step === "done" && confirmation) {
    return (
      /* Deliberately loud. This screen gets held up at arm's length in front
         of whoever is guarding the food, so the whole card is the signal: a
         thick green outline readable across a room, not a small tick that has
         to be squinted at in a queue. --teal is the brand's green; a new one
         would only make the app less consistent to say the same thing. */
      <div className="flex flex-col items-center gap-[13px] rounded-[14px] border-[3px] border-teal bg-teal/[0.07] p-[27px] text-center shadow-[0_0_0_6px_rgba(63,167,137,0.12)]">
        <span
          aria-hidden
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-teal"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12.5l5.5 5.5L20 7" />
          </svg>
        </span>

        <div className="flex flex-col gap-[5px]">
          <span className="font-mono text-[9px] tracking-[0.13em] text-teal uppercase">
            signed in
          </span>
          <p className="font-sans text-[27px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
            {kiosk ? "You're in." : `You're in, ${confirmation.firstName}.`}
          </p>
          <p className="font-sans text-[13.5px] leading-[1.7] text-body">
            {confirmation.visitNumber > 1
              ? `Visit number ${confirmation.visitNumber}. Good to see you back.`
              : "First time here, welcome."}
          </p>
        </div>

        <p className="font-sans text-[13px] leading-[1.6] text-body">
          Show this green screen at the food table.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[15px] rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper p-[19px]">
      <div className="flex flex-col gap-[5px]">
        <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
          {event.venue}
        </span>
        <p className="font-sans text-[23px] leading-[1.3] font-medium tracking-[-0.02em] text-ink">
          {event.name}
        </p>
        <p className="font-sans text-[13.5px] leading-[1.75] text-body">
          {step === "email"
            ? "Sign in with your email. No account needed."
            : returning
              ? `Welcome back${fullName ? `, ${fullName.split(" ")[0]}` : ""}.`
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

          {!kiosk && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wantsToMeet" className="font-sans text-[12px] font-normal text-body">
                Anyone you&rsquo;re hoping to meet tonight?{" "}
                <span className="text-faint">(optional)</span>
              </Label>
              <Textarea
                id="wantsToMeet"
                rows={2}
                value={wantsToMeet}
                onChange={(e) => setWantsToMeet(e.target.value)}
                placeholder="Someone who's raised a pre-seed"
                className="text-[16px]"
              />
            </div>
          )}
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
