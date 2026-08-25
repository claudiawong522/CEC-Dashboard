import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { AskBar } from "@/components/ask/AskBar";
import { MissingKeyNotice } from "@/components/ui/missing-key-notice";
import { Sticker } from "@/components/stickers/Sticker";
import { Sparkle } from "@/components/stickers/shapes";

export default async function AskPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Read here rather than in the client component: the variable is server-only
  // and must never be shipped to the browser, so only the boolean crosses over.
  const hasKey = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="relative flex flex-col gap-[17px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 overflow-hidden"
      >
        <Sticker
          floatVariant="float1"
          floatDuration="15s"
          wrapperClassName="pointer-events-none absolute right-[10%] top-0"
          className="pointer-events-auto opacity-[0.4]"
        >
          <Sparkle size={64} />
        </Sticker>
      </div>

      <div className="relative z-10 flex flex-col gap-[5px]">
        <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          Ask
        </h1>
        <span className="font-sans text-[12.5px] text-body">
          Questions about members, events, outreach, and anything the club has written down.
        </span>
      </div>

      {!hasKey && (
        <div className="relative z-10">
          <MissingKeyNotice
            feature="Ask"
            isAdmin={session.profile.role === "admin"}
            stillWorks="Everything else in the dashboard is unaffected."
          />
        </div>
      )}

      <div className="relative z-10">
        <AskBar />
      </div>
    </div>
  );
}
