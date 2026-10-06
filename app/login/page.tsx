"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/app-shell/BrandMark";
import { TriangleScatter, Marquee } from "@/components/decor/shapes";
import { Sticker } from "@/components/decor/Sticker";
import { IntroPlane } from "@/components/app-shell/IntroPlane";
import { ArrowUpRightIcon } from "lucide-react";

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
    <p className="max-w-[46ch] font-sans text-[13px] leading-[1.6] text-red">
      {ERROR_MESSAGES[code] ?? ERROR_MESSAGES.unknown}
    </p>
  );
}

export default function LoginPage() {
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
      // react-hooks/set-state-in-effect is right in general and wrong here.
      // The fragment is never sent to the server, so this cannot be derived
      // during render: the server would say false, the client true, and the
      // page would fail hydration. An effect is the only place this is
      // knowable, and it runs once on mount for the small number of people
      // arriving from an invite link.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <IntroPlane />

      {/* The site's hero ornament: the logo's tiles, scattered. */}
      <TriangleScatter count={9} seed={3} min={28} max={96} opacity={0.3} />

      <header className="relative z-10 flex items-center gap-3 border-b border-line px-6 py-4 sm:px-10">
        <Sticker floatVariant="none" wrapperClassName="shrink-0">
          <BrandMark className="h-[22px] w-6" />
        </Sticker>
        <span className="font-display text-[14px] font-bold tracking-tight text-foreground uppercase">
          Cornell Entrepreneurship Club
        </span>
        <span className="t-eyebrow ml-auto hidden text-foreground/40 sm:inline">Members and alumni only</span>
      </header>

      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-16 sm:px-10">
        <div className="mx-auto flex w-full max-w-[880px] flex-col gap-8">
          <h1 className="t-display text-[34px] text-balance text-foreground sm:text-[56px] md:text-[72px] lg:text-[96px] xl:text-[104px]">
            Cornell
            <br />
            Entrepreneurship
            <br />
            Club.
          </h1>

          <Marquee
            items={["Innovate", "Disrupt", "Iterate", "Launch", "Scale", "Build", "Create", "Ship", "Grow", "Hustle"]}
            className="-mx-6 w-auto sm:-mx-10"
          />

          <p className="max-w-[48ch] font-sans text-[17px] leading-[1.55] text-subtle sm:text-[20px]">
            {cameFromInvite
              ? "You're invited. Sign in with Google to finish setting up your account."
              : "Dashboard for CEC Members and Alumni"}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Button onClick={signInWithGoogle} size="lg" className="gap-3">
              <GoogleIcon className="size-4" />
              Sign in with Google
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              render={<a href="https://cornellec.com" />}
              nativeButton={false}
            >
              Go back to main site
              <ArrowUpRightIcon className="size-4" />
            </Button>
          </div>

          <Suspense fallback={null}>
            <LoginError />
          </Suspense>

          {/* Raised by the click itself rather than carried in the querystring,
              so it has no redirect to arrive on. */}
          {signInError && <LoginErrorText code={signInError} />}
        </div>
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
