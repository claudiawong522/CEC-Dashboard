import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/getSession";
import { getStudent } from "@/lib/auth/getStudent";
import { BrandMark } from "@/components/app-shell/BrandMark";
import { Sticker } from "@/components/stickers/Sticker";
import { CloudPuff } from "@/components/stickers/shapes";

// A separate shell on purpose. AppShell takes a Profile and renders the club's
// whole navigation; a prospective member has neither a profile nor any
// business seeing that nav. This is the only surface the student tier can
// reach, and it looks like what it is: a front door, not the app.
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  // A member who lands here is sent back into the app — they use the bingo
  // board, not this.
  if (await getSession()) redirect("/coffee-chats");
  if (!(await getStudent())) redirect("/login");

  return (
    <div className="relative min-h-svh bg-page">
      <CloudPuff
        size={320}
        className="pointer-events-none absolute -top-24 -left-24 opacity-[0.16] blur-[2px]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-[880px] items-center gap-2.5 px-6 py-6">
        <Sticker floatVariant="none" wrapperClassName="shrink-0">
          <BrandMark className="h-[22px] w-6" />
        </Sticker>
        <Link
          href="/apply"
          className="font-sans text-[17px] font-medium tracking-[-0.014em] text-ink"
        >
          Cornell Entrepreneurship Club
        </Link>
        <form action="/auth/signout" method="post" className="ml-auto">
          <button
            type="submit"
            className="font-sans text-[12px] text-faint transition-colors duration-200 hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[880px] px-6 pb-16">{children}</main>
    </div>
  );
}
