import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/getSession";
import { getStudent } from "@/lib/auth/getStudent";
import { BrandMark } from "@/components/app-shell/BrandMark";
import { Sticker } from "@/components/decor/Sticker";
import { TriangleScatter } from "@/components/decor/shapes";

// A separate shell on purpose. AppShell takes a Profile and renders the club's
// whole navigation; a prospective member has neither a profile nor any
// business seeing that nav. This is the only surface the student tier can
// reach, and it looks like what it is: a front door, not the app.
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  // A member who lands here is sent back into the app; they use the bingo
  // board, not this.
  if (await getSession()) redirect("/coffee-chats");
  if (!(await getStudent())) redirect("/login");

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <TriangleScatter count={6} seed={101} min={28} max={80} opacity={0.22} />

      <header className="relative z-10 flex items-center gap-3 border-b border-line pt-[max(16px,env(safe-area-inset-top))] pr-[max(16px,env(safe-area-inset-right))] pb-4 pl-[max(16px,env(safe-area-inset-left))] sm:px-10">
        <Sticker floatVariant="none" wrapperClassName="shrink-0">
          <BrandMark className="h-[22px] w-6" />
        </Sticker>
        <Link
          href="/apply"
          className="inline-flex min-h-11 min-w-0 items-center font-display text-[13px] font-bold tracking-tight text-foreground uppercase sm:text-[14px]"
        >
          Cornell Entrepreneurship Club
        </Link>
        <form action="/auth/signout" method="post" className="ml-auto">
          <button
            type="submit"
            className="link-underline inline-flex min-h-11 items-center font-display text-[12px] font-bold tracking-wide text-foreground/50 uppercase transition-colors duration-200 hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[880px] px-4 pt-6 pb-[max(40px,env(safe-area-inset-bottom))] sm:px-10 sm:py-10">{children}</main>
    </div>
  );
}
