import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { UserTable } from "@/components/admin/UserTable";
import { InviteForm } from "@/components/admin/InviteForm";
import { PageHeader } from "@/components/ui/page-header";
import { Sticker } from "@/components/decor/Sticker";
import { TriangleScatter, TriRow } from "@/components/decor/shapes";
import type { Profile } from "@/lib/auth/getSession";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createClient();
  // Removed people are gone from this screen entirely. Their row survives in
  // the database because everything they authored points at it, but nothing
  // here should hint that they were ever members — inviting them again is
  // what brings them back, and it looks like any other first-time invite.
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, status")
    .neq("status", "revoked")
    .order("full_name", { ascending: true, nullsFirst: false })
    .returns<Profile[]>();

  const initials = (session.profile.full_name ?? session.profile.email)
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative flex flex-col gap-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-40">
        <TriangleScatter count={4} seed={36} opacity={0.2} />
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <PageHeader title="Admin" />
        <div className="flex items-center gap-2.5">
          <div className="flex size-[26px] shrink-0 items-center justify-center border-2 border-foreground bg-background font-display text-[9.5px] font-bold text-foreground">
            {initials}
          </div>
          <span className="font-sans text-[13px] text-subtle">
            Signed in as {session.profile.full_name ?? session.profile.email} ·{" "}
            {session.profile.email}
          </span>
          <Sticker floatVariant="none" className="opacity-70 transition-opacity duration-200 hover:opacity-100">
            <TriRow size={8} gap={4} />
          </Sticker>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        {session.profile.role === "admin" && <InviteForm />}

        <UserTable
          users={users ?? []}
          canManageRoles={session.profile.role === "admin"}
          currentUserId={session.profile.id}
        />
        <span className="font-sans text-[12px] text-foreground/50">
          Non-admins see the same table with static role badges.
        </span>
      </div>
    </div>
  );
}
