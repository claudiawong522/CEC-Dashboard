import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { AppShell } from "@/components/app-shell/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return <AppShell profile={session.profile}>{children}</AppShell>;
}
