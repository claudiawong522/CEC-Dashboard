"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/app-shell/BrandMark";

const ERROR_MESSAGES: Record<string, string> = {
  domain: "Please sign in with an @cornell.edu email address.",
  unknown: "Something went wrong signing you in. Please try again.",
};

function LoginError() {
  const params = useSearchParams();
  const error = params.get("error");
  if (!error) return null;
  return (
    <p className="font-sans text-xs text-destructive">
      {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.unknown}
    </p>
  );
}

export default function LoginPage() {
  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: "cornell.edu" },
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

      {/* Ambient stickers — non-interactive, drift only */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute top-[20%] left-[14%] flex gap-1 opacity-50 animate-float2">
          <span className="size-2 rounded-full bg-coral" />
          <span className="size-2 rounded-full bg-amber" />
          <span className="size-2 rounded-full bg-teal" />
          <span className="size-2 rounded-full bg-blue" />
        </div>
        <div
          className="absolute top-[16%] right-[15%] size-8 opacity-70 animate-float1"
          style={{
            background: "linear-gradient(140deg,#E0B94A,#E8583D)",
            clipPath:
              "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 92%,50% 70%,21% 92%,32% 57%,2% 35%,39% 35%)",
          }}
        />
        <div
          className="absolute bottom-[22%] left-[20%] size-11 rounded-full opacity-60 blur-[8px] animate-float2"
          style={{
            background:
              "radial-gradient(circle at 40% 35%, #F0836B, #E8583D 70%)",
          }}
        />
        <div
          className="absolute right-[18%] bottom-[18%] size-7 rounded-full opacity-55 blur-[2px] animate-float1"
          style={{
            background:
              "radial-gradient(circle at 35% 35%, #E0B94A, rgba(224,185,74,.5) 75%)",
          }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-[19px]">
        <BrandMark className="h-[30px] w-[34px]" />
        <h1 className="font-sans text-[27px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          CEC Dashboard
        </h1>
        <p className="font-sans text-sm text-body">
          Sign in with your @cornell.edu account
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
