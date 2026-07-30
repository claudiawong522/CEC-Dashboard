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

  const initials = (session.profile.full_name ?? session.profile.email)
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-[17px]">
      <div className="flex flex-col gap-[5px]">
        <h1 className="font-sans text-2xl leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          Admin
        </h1>
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-[26px] items-center justify-center">
            <div
              className="absolute -inset-0.5 rounded-full opacity-75 blur-[2px]"
              style={{
                background:
                  "conic-gradient(from 200deg, #E8583D, #E0B94A, #3FA789, #3B6FC2, #E8583D)",
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
        </div>
      </div>

      <UserTable
        users={users ?? []}
        canManageRoles={session.profile.role === "admin"}
        currentUserId={session.profile.id}
      />
    </div>
  );
}
