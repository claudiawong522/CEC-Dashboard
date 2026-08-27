"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { claimFood, lookupGuest, submitSignIn } from "@/lib/actions/signin";
import type { CurrentEvent } from "@/lib/types/signin";

// Fields the person filling this in has no session and no account, so the
// email is the whole identity. Everything stable about them is asked once,
// ever; the per-night question is asked every time.
type Step = "email" | "details" | "done" | "food";

// The netid of whoever last signed in on this device, so the food scan is one
// tap rather than retyping. Never on the kiosk, which is shared: that laptop
// must not offer the previous person's food.
const REMEMBERED = "cec.checkin.email";

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
  const [foodDone, setFoodDone] = useState(false);
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

  useEffect(() => {
    if (kiosk || !event.foodIsOpen) return;
    try {
      const remembered = window.localStorage.getItem(REMEMBERED);
      if (remembered) {
        // localStorage is exactly the "external system" this rule's own
        // guidance carves out, and it cannot be read during render without a
        // hydration mismatch: the server has no idea what this device knows.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEmail(remembered);
        setStep("food");
      }
    } catch {
      // Nothing remembered we can reach; they type it instead.
    }
  }, [kiosk, event.foodIsOpen]);

  function getFood() {
    setError(null);
    startTransition(async () => {
      const result = await claimFood(email);
      switch (result.status) {
        case "collected":
          setConfirmation({ firstName: result.firstName, visitNumber: result.visitNumber });
          setFoodDone(true);
          setStep("food");
          break;
        case "already":
          setError(`Already collected at ${result.at}.`);
          break;
        case "not_yet":
          setError(`Food opens at ${result.opensAt}.`);
          break;
        case "not_signed_in":
          setError("You need to have signed in before food opened.");
          break;
        case "closed":
          setError("Nothing is running right now.");
          break;
        default:
          setError(result.message);
      }
    });
  }

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

      if (!kiosk) {
        try {
          window.localStorage.setItem(REMEMBERED, email.trim().toLowerCase());
        } catch {
          // Private browsing, or storage disabled. The food scan just asks for
          // the address again, which is the pre-existing behaviour.
        }
      }

      setConfirmation({
        firstName: result.firstName ?? fullName.split(" ")[0],
        visitNumber: result.visitNumber ?? 1,
      });
      setStep("done");
    });
  }

  // The green pass, and only here. It used to fire the moment someone signed in,
  // which handed out a food pass at the door: exactly the behaviour the gating
  // exists to stop.
  if (step === "food" && foodDone && confirmation) {
    return (
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
            food
          </span>
          {/* The name is the anti-cheat: whoever is handing out food reads it,
              so a screenshot of someone else's pass does not travel. */}
          <p className="font-sans text-[31px] leading-[1.15] font-medium tracking-[-0.024em] text-ink">
            {confirmation.firstName}
          </p>
          <p className="font-sans text-[13.5px] leading-[1.7] text-body">
            {confirmation.visitNumber > 1
              ? `Visit number ${confirmation.visitNumber}.`
              : "First time here, welcome."}
          </p>
        </div>

        <p className="font-sans text-[13px] leading-[1.6] text-body">
          Show this at the food table.
        </p>
      </div>
    );
  }

  // Signed in, waiting. Deliberately not green: nothing to collect yet.
  if (step === "done" && confirmation) {
    return (
      <div className="flex flex-col gap-[9px] rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper p-[19px]">
        <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
          signed in
        </span>
        <p className="font-sans text-[23px] leading-[1.3] font-medium tracking-[-0.02em] text-ink">
          {kiosk ? "You're in." : `You're in, ${confirmation.firstName}.`}
        </p>
        <p className="font-sans text-[13.5px] leading-[1.75] text-body">
          {confirmation.visitNumber > 1
            ? `Visit number ${confirmation.visitNumber}. Good to see you back.`
            : "First time here, welcome."}
        </p>
        {!kiosk && (
          <p className="font-sans text-[13px] leading-[1.7] text-body">
            {event.foodIsOpen
              ? "Food is out. Scan the code again to collect."
              : `Food at ${event.foodOpensAt}. Scan this code again then and it'll turn green.`}
          </p>
        )}
      </div>
    );
  }

  // Food is open and this device knows who they are: one tap.
  if (step === "food") {
    return (
      <div className="flex flex-col gap-[13px] rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper p-[19px]">
        <div className="flex flex-col gap-[5px]">
          <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
            {event.venue}
          </span>
          <p className="font-sans text-[23px] leading-[1.3] font-medium tracking-[-0.02em] text-ink">
            Food is out.
          </p>
          <p className="font-sans text-[13.5px] leading-[1.75] text-body">
            Collecting as {email}.
          </p>
        </div>

        {error && <p className="font-sans text-[12px] text-destructive">{error}</p>}

        <div className="flex items-center gap-[14px]">
          <Button type="button" loading={isPending} onClick={getFood} className="px-5 py-3 text-[14px]">
            Get food
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setEmail("");
              setError(null);
            }}
            className="font-sans text-[12.5px] text-faint transition-colors duration-200 hover:text-ink"
          >
            Not you?
          </button>
        </div>
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
