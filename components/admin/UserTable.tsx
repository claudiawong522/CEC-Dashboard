import { RoleSelect } from "@/components/admin/RoleSelect";
import { RevokeInviteButton } from "@/components/admin/RevokeInviteButton";
import { RemoveAccessButton } from "@/components/admin/RemoveAccessButton";
import { RestoreAccessButton } from "@/components/admin/RestoreAccessButton";
import type { Profile } from "@/lib/auth/getSession";

export function UserTable({
  users,
  canManageRoles,
  currentUserId,
}: {
  users: Profile[];
  canManageRoles: boolean;
  currentUserId: string;
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper">
      <div className="grid grid-cols-[1.3fr_1.6fr_0.9fr_72px] gap-3 border-b border-[rgba(35,32,28,0.08)] px-[15px] py-2.5 font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
        <span>name</span>
        <span>email</span>
        <span>access</span>
        <span />
      </div>
      {users.map((user, i) => {
        const isSelf = user.id === currentUserId;
        const isPending = user.status === "invited";
        const isRemoved = user.status === "revoked";
        return (
          <div
            key={user.id}
            className={`grid grid-cols-[1.3fr_1.6fr_0.9fr_72px] items-center gap-3 px-[15px] py-3 transition-colors duration-200 hover:bg-wash ${
              i < users.length - 1 ? "border-b border-[rgba(35,32,28,0.07)]" : ""
            }`}
          >
            <span
              className={`truncate font-sans text-[12.5px] ${
                isPending || isRemoved ? "text-faint italic" : "text-ink"
              } ${isSelf ? "font-medium" : "font-normal"}`}
            >
              {isPending ? "Invite pending" : (user.full_name ?? "—")}
            </span>
            <span
              className={`truncate font-sans text-[12px] ${isRemoved ? "text-faint line-through" : "text-body"}`}
            >
              {user.email}
            </span>
            {isRemoved ? (
              <span className="justify-self-start rounded-[20px] border border-line-input bg-page px-[9px] py-[5px] font-mono text-[9.5px] tracking-[0.1em] text-faint uppercase">
                removed
              </span>
            ) : isPending ? (
              <span
                className="justify-self-start rounded-[20px] border border-[rgba(224,185,74,0.4)] bg-amber/10 px-[9px] py-[5px] font-mono text-[9.5px] tracking-[0.1em] text-strong uppercase"
                title={`Will become ${user.role} on accept`}
              >
                pending · {user.role}
              </span>
            ) : isSelf ? (
              <span
                className="justify-self-start rounded-[20px] px-[9px] py-[5px] font-mono text-[9.5px] tracking-[0.1em] text-ink uppercase"
                style={{
                  background:
                    "linear-gradient(95deg, rgba(232,88,61,.2), rgba(224,185,74,.2), rgba(63,167,137,.2), rgba(59,111,194,.2))",
                }}
              >
                {user.role}
              </span>
            ) : canManageRoles ? (
              <RoleSelect userId={user.id} role={user.role} />
            ) : (
              <span className="justify-self-start rounded-[20px] border border-line-input bg-page px-[9px] py-[5px] font-mono text-[9.5px] tracking-[0.1em] text-body uppercase">
                {user.role}
              </span>
            )}
            <span className="flex justify-end">
              {/* No action against yourself: removeAccess refuses it server-side
                  anyway, so offering the button would only ever produce an error. */}
              {!canManageRoles || isSelf ? null : isPending ? (
                <RevokeInviteButton userId={user.id} email={user.email} />
              ) : isRemoved ? (
                <RestoreAccessButton userId={user.id} />
              ) : (
                <RemoveAccessButton userId={user.id} email={user.email} />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
