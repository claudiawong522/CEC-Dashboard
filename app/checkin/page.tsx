import { getCurrentSignInEvent } from "@/lib/actions/signin";
import { CheckInForm } from "@/components/signin/CheckInForm";
import { BrandMark } from "@/components/app-shell/BrandMark";
import { Sticker } from "@/components/stickers/Sticker";
import { CloudPuff } from "@/components/stickers/shapes";

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

  // overflow-hidden matters: the CloudPuff below is deliberately hung off the
  // right edge, and unclipped it widens the document. On a 375px phone the page
  // scrolled sideways to 455px.
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-page">
      <CloudPuff
        size={320}
        className="pointer-events-none absolute -top-24 -right-20 opacity-[0.16] blur-[2px]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-[520px] items-center gap-2.5 px-6 pt-8 pb-2">
        <Sticker floatVariant="none" wrapperClassName="shrink-0">
          <BrandMark className="h-[22px] w-6" />
        </Sticker>
        <span className="font-sans text-[17px] font-medium tracking-[-0.014em] text-ink">
          Cornell Entrepreneurship Club
        </span>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center px-6 pt-4 pb-16">
        <CheckInForm event={event} kiosk={isKiosk} />
      </main>
    </div>
  );
}
