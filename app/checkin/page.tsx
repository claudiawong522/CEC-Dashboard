import { getCurrentSignInEvent } from "@/lib/actions/signin";
import { CheckInForm } from "@/components/signin/CheckInForm";
import { BrandMark } from "@/components/app-shell/BrandMark";
import { Sticker } from "@/components/stickers/Sticker";
import { CloudPuff } from "@/components/stickers/shapes";

// One QR code, printed once, on a poster that gets reused every week. Which
// event a scan belongs to is resolved from the clock rather than from the URL,
// so there is nothing here to regenerate and a photographed poster is worthless
// on a night with nothing on.
//
// Never cached: the entire page is a question about what time it is.
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
        {event ? (
          <CheckInForm event={event} kiosk={isKiosk} />
        ) : (
          <div className="flex flex-col gap-[9px] rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper p-[19px]">
            <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
              nothing on right now
            </span>
            <p className="font-sans text-[19px] leading-[1.35] font-medium tracking-[-0.018em] text-ink">
              There&rsquo;s no event running at the moment.
            </p>
            <p className="font-sans text-[13.5px] leading-[1.75] text-body">
              Startup Hours runs most weeks. Scan this same code again when
              you&rsquo;re next in the room and it&rsquo;ll know which night it is.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
