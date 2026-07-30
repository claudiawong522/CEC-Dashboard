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

      {/* Ambient stickers — non-interactive, drift only. Matches
          design/CEC Pages.dc.html "01 · login" stickers S1–S7 exactly. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* S1 — flower (5 blurred coral petals + amber center) */}
        <div
          className="absolute top-[22%] left-[11%] size-[78px] opacity-85"
          style={{ animation: "float1 11s ease-in-out infinite" }}
        >
          {[0, 72, 144, 216, 288].map((deg) => (
            <div
              key={deg}
              className="absolute top-[2px] left-[24px] h-[42px] w-[30px] rounded-full blur-[8px]"
              style={{
                background:
                  "radial-gradient(circle at 50% 64%, #E8583D, rgba(232,88,61,.28) 60%, transparent 76%)",
                transformOrigin: "50% 96%",
                transform: `rotate(${deg}deg)`,
              }}
            />
          ))}
          <div
            className="absolute top-[33px] left-[33px] size-[11px] rounded-full blur-[2px]"
            style={{ background: "#E0B94A" }}
          />
        </div>

        {/* S2 — sparkle/star (10-point polygon) */}
        <div
          className="absolute top-[17%] right-[13%] size-[34px] opacity-70"
          style={{
            background: "linear-gradient(140deg,#E0B94A,#E8583D)",
            clipPath:
              "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 92%,50% 70%,21% 92%,32% 57%,2% 35%,39% 35%)",
            animation: "float2 13s ease-in-out infinite",
          }}
        />

        {/* S3 — twinkling diamond pair (blue + gold) */}
        <div
          className="absolute bottom-[16%] left-[22%] size-11 opacity-75"
          style={{ animation: "float3 15s ease-in-out infinite" }}
        >
          <div
            className="absolute top-[2px] left-[8px] h-[38px] w-[27px]"
            style={{
              background: "#3B6FC2",
              clipPath: "polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)",
              animation: "twinkle 2.8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute top-[24px] left-[27px] h-[19px] w-[15px]"
            style={{
              background: "#E0B94A",
              clipPath: "polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)",
              animation: "twinkle 2.8s ease-in-out infinite",
              animationDelay: "0.7s",
            }}
          />
        </div>

        {/* S4 — coral blob (heart-ish: two circles + triangle) */}
        <div
          className="absolute right-[19%] bottom-[21%] size-[38px] opacity-65"
          style={{ animation: "float1 12s ease-in-out infinite", animationDelay: "1.4s" }}
        >
          <div
            className="absolute top-[5px] left-[6px] size-[22px] rounded-full blur-[2px]"
            style={{
              background: "radial-gradient(circle at 40% 35%, #F0836B, #E8583D 70%)",
            }}
          />
          <div
            className="absolute top-[5px] left-[16px] size-[22px] rounded-full blur-[2px]"
            style={{
              background: "radial-gradient(circle at 40% 35%, #F0836B, #E8583D 70%)",
            }}
          />
          <div
            className="absolute top-[13px] left-[9px] size-[22px] blur-[2px]"
            style={{
              background: "#E8583D",
              clipPath: "polygon(0 0,100% 0,50% 100%)",
            }}
          />
        </div>

        {/* S5 — sprig (teal stem + leaves + coral bud) */}
        <div
          className="absolute top-[11%] left-[38%] size-[66px] opacity-60"
          style={{ animation: "float2 17s ease-in-out infinite" }}
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
              background: "radial-gradient(circle at 70% 50%, #3FA789, transparent 74%)",
              transform: "rotate(-18deg)",
            }}
          />
          <div
            className="absolute top-[32px] left-[31px] h-3 w-6 rounded-full blur-[5px]"
            style={{
              background: "radial-gradient(circle at 30% 50%, #3FA789, transparent 74%)",
              transform: "rotate(18deg)",
            }}
          />
          <div
            className="absolute top-[2px] left-[26px] h-4 w-[13px] blur-[4px]"
            style={{
              background: "radial-gradient(circle at 50% 70%, #E8583D, transparent 76%)",
              borderRadius: "50% 50% 45% 45%",
            }}
          />
        </div>

        {/* S6 — crescent moon (circle with page-colored offset cutout) */}
        <div
          className="absolute top-[38%] right-[31%] size-8 opacity-55"
          style={{ animation: "float3 14s ease-in-out infinite", animationDelay: "0.8s" }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 35% 35%, #E0B94A, rgba(224,185,74,.5) 75%)",
            }}
          />
          <div className="absolute top-[-3px] left-[9px] size-[29px] rounded-full bg-page" />
        </div>

        {/* S7 — bead row (four section-colored dots) */}
        <div
          className="absolute bottom-[34%] left-[8%] flex gap-1 opacity-50"
          style={{ animation: "float2 16s ease-in-out infinite", animationDelay: "2s" }}
        >
          <span className="size-[9px] rounded-full bg-coral" />
          <span className="size-[9px] rounded-full bg-amber" />
          <span className="size-[9px] rounded-full bg-teal" />
          <span className="size-[9px] rounded-full bg-blue" />
        </div>
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
