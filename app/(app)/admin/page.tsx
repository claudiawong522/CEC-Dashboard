import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { UserTable } from "@/components/admin/UserTable";
import { InviteForm } from "@/components/admin/InviteForm";
import { AdminDecor } from "@/components/admin/AdminDecor";
import { Sticker } from "@/components/stickers/Sticker";
import { BeadRow } from "@/components/stickers/shapes";
import type { Profile } from "@/lib/auth/getSession";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, status")
    .order("full_name", { ascending: true, nullsFirst: false })
    .returns<Profile[]>();

  const initials = (session.profile.full_name ?? session.profile.email)
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative flex flex-col gap-[17px]">
      <AdminDecor />
      <div className="relative z-10 flex flex-col gap-[5px]">
        <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          Admin
        </h1>
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-[26px] items-center justify-center">
            <div
              className="absolute -inset-0.5 rounded-full opacity-75 blur-[2px]"
              style={{
                background:
                  "conic-gradient(from 200deg, var(--coral), var(--amber), var(--teal), var(--blue), var(--coral))",
              }}
            />
            <div className="relative flex size-[26px] items-center justify-center rounded-full bg-wash font-sans text-[9.5px] font-medium text-strong">
              {initials}
            </div>
          </div>
          <span className="font-sans text-[12.5px] text-body">
            Signed in as {session.profile.full_name ?? session.profile.email} ·{" "}
            {session.profile.email}
          </span>
          <Sticker floatVariant="none" className="opacity-70 hover:opacity-100">
            <BeadRow size={7} gap={4} />
          </Sticker>
        </div>
      </div>

      {session.profile.role === "admin" && <InviteForm />}

      <UserTable
        users={users ?? []}
        canManageRoles={session.profile.role === "admin"}
        currentUserId={session.profile.id}
      />
      <span className="font-sans text-[11.5px] text-faint">
        Non-admins see the same table with static role badges.
      </span>
    </div>
  );
}
