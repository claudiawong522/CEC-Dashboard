"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/app-shell/BrandMark";
import { cn } from "@/lib/utils";

type StickerKey = "mark" | "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7";

const ERROR_MESSAGES: Record<string, string> = {
  not_invited: "This app is invite-only — ask an admin to invite your email first.",
  removed: "Your access to this app was removed. Ask an admin if you think that's a mistake.",
  unknown: "Something went wrong signing you in. Please try again.",
  provider_disabled:
    "Google sign-in isn't switched on for this environment yet. On a local stack that means SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID and _SECRET are missing from supabase/.env.",
};

function LoginError() {
  const params = useSearchParams();
  const error = params.get("error");
  if (!error) return null;
  return <LoginErrorText code={error} />;
}

function LoginErrorText({ code }: { code: string }) {
  return (
    <p className="max-w-[46ch] font-sans text-[12px] leading-[1.6] text-destructive">
      {ERROR_MESSAGES[code] ?? ERROR_MESSAGES.unknown}
    </p>
  );
}

export default function LoginPage() {
  const [pops, setPops] = useState<Record<StickerKey, number>>({
    mark: 0,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    s7: 0,
  });
  function pop(key: StickerKey) {
    setPops((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  }

  const [cameFromInvite, setCameFromInvite] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Someone clicking the invite email's own link lands here with usable
  // session tokens in the URL hash. We deliberately throw them away and ask
  // for a Google sign-in instead.
  //
  // Consuming them "works" — it signs the person in immediately — but a
  // Supabase invite creates a bare auth user with no name attached, so an
  // account accepted this way has nothing to show in Admin but a dash. And
  // because sessions don't expire, that person may never sign in again for
  // the name to be filled in later; two of the first three members ended up
  // exactly there. Google is the only source of a real name, so it's the
  // only door. The invite itself isn't wasted: the profiles row already
  // exists with the admin's chosen role, and app/auth/callback/route.ts
  // flips it to active on their first Google sign-in.
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    if (hashParams.get("access_token") && hashParams.get("refresh_token")) {
      // Strip the tokens from the address bar even though we never use
      // them — they're live credentials until they expire, and they've no
      // business sitting in browser history or a pasted URL.
      window.history.replaceState(null, "", window.location.pathname);
      setCameFromInvite(true);
    }
    // Otherwise show the normal login screen, even if some other session
    // already exists in this browser. Auto-skipping past it previously
    // fought with people trying to consciously sign in as a *different*
    // account (e.g. accepting an invite while signed in as the admin who
    // sent it).
  }, []);

  async function signInWithGoogle() {
    const supabase = createClient();

    // Ask whether the provider is actually enabled before redirecting.
    //
    // signInWithOAuth navigates the browser straight to GoTrue's /authorize,
    // so when the provider is off the person lands on a raw
    // {"code":400,...,"msg":"Unsupported provider: provider is not enabled"}
    // JSON body with no way back. The app never gets to handle it, because by
    // then it is not the page any more. /auth/v1/settings is public and lists
    // which providers are on, so the check costs one request and keeps the
    // failure inside the app, where it can say something useful. This also
    // covers the provider being switched off in production by accident.
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,
        { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } },
      );
      if (response.ok) {
        const settings = (await response.json()) as { external?: Record<string, boolean> };
        if (settings.external?.google === false) {
          setSignInError("provider_disabled");
          return;
        }
      }
    } catch {
      // Unreachable settings endpoint is not a reason to block a sign-in that
      // might otherwise work: fall through and let the redirect try.
    }

    setSignInError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Always show Google's account picker, even if this browser already
        // has an active Google session — otherwise Google silently reuses
        // whichever account is already signed in instead of letting the
        // person choose. No `hd` domain hint anymore either: invites (see
        // lib/actions/admin.ts) aren't limited to @cornell.edu, so hinting
        // one domain would just hide other valid accounts from the list.
        queryParams: { prompt: "select_account" },
      },
    });
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-page px-6">
      {/* Bottom-anchored cloud wash — the login screen's one decor moment */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 blur-[8px]"
        style={{
          background:
            "radial-gradient(420px 240px at 34% 116%, rgba(232,88,61,.22), transparent 70%), radial-gradient(420px 240px at 68% 122%, rgba(59,111,194,.2), transparent 70%), radial-gradient(320px 190px at 52% 128%, rgba(224,185,74,.18), transparent 70%)",
        }}
      />

      {/* Ambient stickers — drift continuously, each pops on its own click.
          Matches design/CEC Pages.dc.html "01 · login" stickers S1–S7 exactly. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* S1 — flower (5 blurred coral petals + amber center) */}
        <div
          className="absolute top-[22%] left-[11%]"
          style={{ animation: "float1 11s ease-in-out infinite" }}
        >
          <div
            key={pops.s1}
            onClick={() => pop("s1")}
            className={cn(
              "relative size-[78px] cursor-pointer pointer-events-auto opacity-85",
              pops.s1 > 0 && "animate-pop"
            )}
          >
            {[0, 72, 144, 216, 288].map((deg) => (
              <div
                key={deg}
                className="absolute top-[2px] left-[24px] h-[42px] w-[30px] rounded-full blur-[8px]"
                style={{
                  background:
                    "radial-gradient(circle at 50% 64%, var(--coral), rgba(232,88,61,.28) 60%, transparent 76%)",
                  transformOrigin: "50% 96%",
                  transform: `rotate(${deg}deg)`,
                }}
              />
            ))}
            <div
              className="absolute top-[33px] left-[33px] size-[11px] rounded-full blur-[2px]"
              style={{ background: "var(--amber)" }}
            />
          </div>
        </div>

        {/* S2 — sparkle/star (10-point polygon) */}
        <div
          className="absolute top-[17%] right-[13%]"
          style={{ animation: "float2 13s ease-in-out infinite" }}
        >
          <div
            key={pops.s2}
            onClick={() => pop("s2")}
            className={cn(
              "size-[34px] cursor-pointer pointer-events-auto opacity-70",
              pops.s2 > 0 && "animate-pop"
            )}
            style={{
              background: "linear-gradient(140deg, var(--amber), var(--coral))",
              clipPath:
                "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 92%,50% 70%,21% 92%,32% 57%,2% 35%,39% 35%)",
            }}
          />
        </div>

        {/* S3 — twinkling diamond pair (blue + gold) */}
        <div
          className="absolute bottom-[16%] left-[22%]"
          style={{ animation: "float3 15s ease-in-out infinite" }}
        >
          <div
            key={pops.s3}
            onClick={() => pop("s3")}
            className={cn(
              "relative size-11 cursor-pointer pointer-events-auto opacity-75",
              pops.s3 > 0 && "animate-pop"
            )}
          >
            <div
              className="absolute top-[2px] left-[8px] h-[38px] w-[27px]"
              style={{
                background: "var(--blue)",
                clipPath: "polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)",
                animation: "twinkle 2.8s ease-in-out infinite",
              }}
            />
            <div
              className="absolute top-[24px] left-[27px] h-[19px] w-[15px]"
              style={{
                background: "var(--amber)",
                clipPath: "polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)",
                animation: "twinkle 2.8s ease-in-out infinite",
                animationDelay: "0.7s",
              }}
            />
          </div>
        </div>

        {/* S4 — coral blob (heart-ish: two circles + triangle) */}
        <div
          className="absolute right-[19%] bottom-[21%]"
          style={{ animation: "float1 12s ease-in-out infinite", animationDelay: "1.4s" }}
        >
          <div
            key={pops.s4}
            onClick={() => pop("s4")}
            className={cn(
              "relative size-[38px] cursor-pointer pointer-events-auto opacity-65",
              pops.s4 > 0 && "animate-pop"
            )}
          >
            <div
              className="absolute top-[5px] left-[6px] size-[22px] rounded-full blur-[2px]"
              style={{
                background: "radial-gradient(circle at 40% 35%, var(--coral-bloom), var(--coral) 70%)",
              }}
            />
            <div
              className="absolute top-[5px] left-[16px] size-[22px] rounded-full blur-[2px]"
              style={{
                background: "radial-gradient(circle at 40% 35%, var(--coral-bloom), var(--coral) 70%)",
              }}
            />
            <div
              className="absolute top-[13px] left-[9px] size-[22px] blur-[2px]"
              style={{
                background: "var(--coral)",
                clipPath: "polygon(0 0,100% 0,50% 100%)",
              }}
            />
          </div>
        </div>

        {/* S5 — sprig (teal stem + leaves + coral bud) */}
        <div
          className="absolute top-[11%] left-[38%]"
          style={{ animation: "float2 17s ease-in-out infinite" }}
        >
          <div
            key={pops.s5}
            onClick={() => pop("s5")}
            className={cn(
              "relative size-[66px] cursor-pointer pointer-events-auto opacity-60",
              pops.s5 > 0 && "animate-pop"
            )}
          >
            <div
              className="absolute top-[14px] left-[32px] h-[46px] w-[1.5px]"
              style={{
                background: "linear-gradient(180deg, rgba(63,167,137,.65), rgba(63,167,137,.06))",
              }}
            />
            <div
              className="absolute top-[20px] left-[12px] h-3 w-6 rounded-full blur-[5px]"
              style={{
                background: "radial-gradient(circle at 70% 50%, var(--teal), transparent 74%)",
                transform: "rotate(-18deg)",
              }}
            />
            <div
              className="absolute top-[32px] left-[31px] h-3 w-6 rounded-full blur-[5px]"
              style={{
                background: "radial-gradient(circle at 30% 50%, var(--teal), transparent 74%)",
                transform: "rotate(18deg)",
              }}
            />
            <div
              className="absolute top-[2px] left-[26px] h-4 w-[13px] blur-[4px]"
              style={{
                background: "radial-gradient(circle at 50% 70%, var(--coral), transparent 76%)",
                borderRadius: "50% 50% 45% 45%",
              }}
            />
          </div>
        </div>

        {/* S6 — crescent moon (circle with page-colored offset cutout) */}
        <div
          className="absolute top-[38%] right-[31%]"
          style={{ animation: "float3 14s ease-in-out infinite", animationDelay: "0.8s" }}
        >
          <div
            key={pops.s6}
            onClick={() => pop("s6")}
            className={cn(
              "relative size-8 cursor-pointer pointer-events-auto opacity-55",
              pops.s6 > 0 && "animate-pop"
            )}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle at 35% 35%, var(--amber), rgba(224,185,74,.5) 75%)",
              }}
            />
            <div className="absolute top-[-3px] left-[9px] size-[29px] rounded-full bg-page" />
          </div>
        </div>

        {/* S7 — bead row (four section-colored dots) */}
        <div
          className="absolute bottom-[34%] left-[8%]"
          style={{ animation: "float2 16s ease-in-out infinite", animationDelay: "2s" }}
        >
          <div
            key={pops.s7}
            onClick={() => pop("s7")}
            className={cn(
              "flex cursor-pointer pointer-events-auto gap-1 opacity-50",
              pops.s7 > 0 && "animate-pop"
            )}
          >
            <span className="size-[9px] rounded-full bg-coral" />
            <span className="size-[9px] rounded-full bg-amber" />
            <span className="size-[9px] rounded-full bg-teal" />
            <span className="size-[9px] rounded-full bg-blue" />
          </div>
        </div>
      </div>

      <div className="relative flex flex-col items-center gap-[19px]">
        <div
          key={pops.mark}
          aria-hidden="true"
          onClick={() => pop("mark")}
          className={cn("cursor-pointer pointer-events-auto", pops.mark > 0 && "animate-pop")}
        >
          <BrandMark className="h-[30px] w-[34px]" />
        </div>
        <h1 className="font-sans text-[27px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          CEC Dashboard
        </h1>
        <p className="font-sans text-[14px] text-body">
          {cameFromInvite
            ? "You're invited — sign in with Google to finish setting up."
            : "Sign in with your @cornell.edu account"}
        </p>

        <Button
          onClick={signInWithGoogle}
          className="gap-2.5 rounded-login px-[22px] py-[11px] text-[13.5px] font-medium"
        >
          <span className="flex size-[19px] items-center justify-center rounded-full bg-page">
            <GoogleIcon className="size-3" />
          </span>
          Sign in with Google
        </Button>

        <Suspense fallback={null}>
          <LoginError />
        </Suspense>

        {/* Raised by the click itself rather than carried in the querystring,
            so it has no redirect to arrive on. */}
        {signInError && <LoginErrorText code={signInError} />}
      </div>
    </main>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.64v3h3.87c2.27-2.09 3.58-5.17 3.58-8.83Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.27a12 12 0 0 0 0 10.76l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44A11.89 11.89 0 0 0 12 0 12 12 0 0 0 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}
