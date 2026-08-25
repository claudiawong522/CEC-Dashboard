import { ChatSignupForm } from "@/components/chat/ChatSignupForm";
import { BrandMark } from "@/components/app-shell/BrandMark";
import { Sticker } from "@/components/stickers/Sticker";
import { CloudPuff } from "@/components/stickers/shapes";

// Public, no account. A prospective member describes themselves and a club
// member picks the request up; nobody is asked to browse a directory and guess
// which member is worth an hour.
export const metadata = { title: "Chat with a member | CEC" };

export default function ChatSignupPage() {
  return (
    <div className="relative flex min-h-svh flex-col bg-page">
      <CloudPuff
        size={320}
        className="pointer-events-none absolute -top-24 -right-20 opacity-[0.16] blur-[2px]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-[560px] items-center gap-2.5 px-6 pt-8 pb-2">
        <Sticker floatVariant="none" wrapperClassName="shrink-0">
          <BrandMark className="h-[22px] w-6" />
        </Sticker>
        <span className="font-sans text-[17px] font-medium tracking-[-0.014em] text-ink">
          Cornell Entrepreneurship Club
        </span>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[560px] flex-1 flex-col gap-[19px] px-6 pt-4 pb-16">
        <div className="flex flex-col gap-[7px]">
          <h1 className="font-sans text-[27px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
            Chat with a member
          </h1>
          <p className="max-w-[58ch] font-sans text-[13.5px] leading-[1.75] text-body">
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
