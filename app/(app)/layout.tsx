import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { getStudent } from "@/lib/auth/getStudent";
import { AppShell } from "@/components/app-shell/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    // A student holds a real session but has no profile, so getSession is
    // null for them. Sending them to /login would bounce them straight back
    // here (the login page redirects an already-signed-in visitor onward) and
    // loop; send them to the one area they're allowed instead.
    if (await getStudent()) redirect("/matching");
    redirect("/login");
  }

  return <AppShell profile={session.profile}>{children}</AppShell>;
}
