import { ChatSignupForm } from "@/components/chat/ChatSignupForm";
import { BrandMark } from "@/components/app-shell/BrandMark";
import { Sticker } from "@/components/decor/Sticker";
import { MintRule, TriangleScatter } from "@/components/decor/shapes";

// Public, no account. A prospective member describes themselves and a club
// member picks the request up; nobody is asked to browse a directory and guess
// which member is worth an hour.
export const metadata = { title: "Chat with a member | CEC" };

export default function ChatSignupPage() {
  // overflow-hidden keeps the triangle scatter from widening the document on
  // a phone.
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <TriangleScatter count={6} seed={111} min={28} max={80} opacity={0.22} />

      <header className="relative z-10 flex items-center gap-3 border-b border-line px-6 py-4 sm:px-10">
        <Sticker floatVariant="none" wrapperClassName="shrink-0">
          <BrandMark className="h-[22px] w-6" />
        </Sticker>
        <span className="font-display text-[14px] font-bold tracking-tight text-foreground uppercase">
          Cornell Entrepreneurship Club
        </span>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-6 px-6 pt-10 pb-16">
        <div className="flex flex-col gap-3">
          <h1 className="t-display text-[40px] text-foreground">
            Chat with a member
          </h1>
          <MintRule className="w-20" />
          <p className="max-w-[58ch] font-sans text-[14px] leading-[1.6] text-subtle">
            Tell us a bit about yourself and what you&rsquo;d like to talk about.
            Someone whose interests line up with yours will pick it up and get in
            touch. No account needed.
          </p>
        </div>

        <ChatSignupForm />
      </main>
    </div>
  );
}
