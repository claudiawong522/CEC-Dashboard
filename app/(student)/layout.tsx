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
  // A member who lands here is sent back into the app — they use the bingo
  // board, not this.
  if (await getSession()) redirect("/coffee-chats");
  if (!(await getStudent())) redirect("/login");

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <TriangleScatter count={6} seed={101} min={28} max={80} opacity={0.22} />

      <header className="relative z-10 flex items-center gap-3 border-b border-line px-6 py-4 sm:px-10">
        <Sticker floatVariant="none" wrapperClassName="shrink-0">
          <BrandMark className="h-[22px] w-6" />
        </Sticker>
        <Link
          href="/apply"
          className="font-display text-[14px] font-bold tracking-tight text-foreground uppercase"
        >
          Cornell Entrepreneurship Club
        </Link>
        <form action="/auth/signout" method="post" className="ml-auto">
          <button
            type="submit"
            className="link-underline font-display text-[12px] font-bold tracking-wide text-foreground/50 uppercase transition-colors duration-200 hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[880px] px-6 py-10 sm:px-10">{children}</main>
    </div>
  );
}
