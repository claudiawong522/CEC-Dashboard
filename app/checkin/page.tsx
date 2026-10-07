import { getCurrentSignInEvent } from "@/lib/actions/signin";
import { CheckInForm } from "@/components/signin/CheckInForm";
import { BrandMark } from "@/components/app-shell/BrandMark";
import { Sticker } from "@/components/decor/Sticker";
import { Marquee, TriangleScatter } from "@/components/decor/shapes";

// One QR code, printed once, on a poster that gets reused every week. Which
// event a scan belongs to is resolved from today's date rather than from the
// URL, so there is nothing here to regenerate.
//
// The code always works. It used to open and close on a clock, which meant a
// scan at 7:29, or at a one-off afternoon session nobody had added, showed
// "nothing on" to somebody standing in the room. A sign in with no event
// attached is a far smaller problem than a poster that looks broken, so the
// form is always up and /signins attaches the strays afterwards.
//
// Never cached: the entire page is a question about what day it is.
export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in | CEC" };

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ kiosk?: string }>;
}) {
  const { kiosk } = await searchParams;
  const event = await getCurrentSignInEvent();
  const isKiosk = kiosk === "1" || kiosk === "true";

  // overflow-hidden keeps the triangle scatter from widening the document on
  // a phone.
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <TriangleScatter count={6} seed={121} min={28} max={80} opacity={0.22} />

      <header className="relative z-10 flex items-center gap-3 border-b border-line px-6 py-4 sm:px-10">
        <Sticker floatVariant="none" wrapperClassName="shrink-0">
          <BrandMark className="h-[22px] w-6" />
        </Sticker>
        <span className="font-display text-[14px] font-bold tracking-tight text-foreground uppercase">
          Cornell Entrepreneurship Club
        </span>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center gap-6 px-6 pt-8 pb-16">
        <Marquee
          items={["Innovate", "Disrupt", "Iterate", "Launch", "Scale", "Build", "Create", "Ship", "Grow", "Hustle"]}
          className="-mx-6 w-auto"
        />
        <CheckInForm event={event} kiosk={isKiosk} />
      </main>
    </div>
  );
}
