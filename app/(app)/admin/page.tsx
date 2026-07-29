import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { UserTable } from "@/components/admin/UserTable";
import type { Profile } from "@/lib/auth/getSession";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role")
    .order("full_name", { ascending: true, nullsFirst: false })
    .returns<Profile[]>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {session.profile.full_name ?? session.profile.email} ·{" "}
          {session.profile.email}
        </p>
      </div>

      <UserTable users={users ?? []} canManageRoles={session.profile.role === "admin"} />
    </div>
  );
}
