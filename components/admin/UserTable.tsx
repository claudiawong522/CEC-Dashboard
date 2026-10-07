import { RoleSelect } from "@/components/admin/RoleSelect";
import { RevokeInviteButton } from "@/components/admin/RevokeInviteButton";
import { RemoveAccessButton } from "@/components/admin/RemoveAccessButton";
import type { Profile } from "@/lib/auth/getSession";

// Removed people never arrive here — app/(app)/admin/page.tsx filters
// status='revoked' out of the query, so this table only ever shows invited
// and active rows. Their profile row still exists in the database, since
// everything they authored references it; it just isn't anyone's business
// on this screen. Getting them back is a fresh invite, not a restore.

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
    <div className="border border-line bg-background">
      <div className="t-eyebrow grid grid-cols-[1.3fr_1.6fr_0.9fr_24px] gap-3 border-b border-foreground bg-muted px-4 py-2.5 text-foreground">
        <span>name</span>
        <span>email</span>
        <span>access</span>
        <span />
      </div>
      {users.map((user, i) => {
        const isSelf = user.id === currentUserId;
        const isPending = user.status === "invited";
        return (
          <div
            key={user.id}
            className={`grid grid-cols-[1.3fr_1.6fr_0.9fr_24px] items-center gap-3 px-4 py-3 transition-colors duration-200 ease-fluid hover:bg-muted/40 ${
              i < users.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <span
              className={`truncate font-sans text-[13px] ${
                isPending ? "text-foreground/50" : "text-foreground"
              } ${isSelf ? "font-medium" : "font-normal"}`}
            >
              {isPending ? "Invite pending" : (user.full_name ?? "—")}
            </span>
            <span className="truncate font-sans text-[12.5px] text-subtle">{user.email}</span>
            {isPending ? (
              <span
                className="t-eyebrow justify-self-start border border-amber bg-amber/10 px-2 py-0.5 text-foreground"
                title={`Will become ${user.role} on accept`}
              >
                pending · {user.role}
              </span>
            ) : isSelf ? (
              <span className="t-eyebrow justify-self-start border border-foreground bg-mint px-2 py-0.5 text-foreground">
                {user.role}
              </span>
            ) : canManageRoles ? (
              <RoleSelect userId={user.id} role={user.role} />
            ) : (
              <span className="t-eyebrow justify-self-start border border-line px-2 py-0.5 text-subtle">
                {user.role}
              </span>
            )}
            <span className="flex justify-end">
              {/* No action against yourself: removeAccess refuses it server-side
                  anyway, so offering the button would only ever produce an error. */}
              {!canManageRoles || isSelf ? null : isPending ? (
                <RevokeInviteButton userId={user.id} email={user.email} />
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
