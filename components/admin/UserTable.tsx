import { RoleSelect } from "@/components/admin/RoleSelect";
import { RevokeInviteButton } from "@/components/admin/RevokeInviteButton";
import { RemoveAccessButton } from "@/components/admin/RemoveAccessButton";
import { PositionInput } from "@/components/admin/PositionInput";
import type { Profile } from "@/lib/auth/getSession";
import { POSITION_SUGGESTIONS } from "@/lib/validation/member-schemas";

export type AdminUser = Profile & { position: string };

// Removed people never arrive here: app/(app)/admin/page.tsx filters
// status='revoked' out of the query, so this table only ever shows invited
// and active rows. Their profile row still exists in the database, since
// everything they authored references it; it just isn't anyone's business
// on this screen. Getting them back is a fresh invite, not a restore.

// On phones each row is a small card: name over email on the left, access
// under them, then position, and the remove action pinned to the right edge.
// From md up it is the five-column table.
const ROW_GRID = "md:grid-cols-[1.2fr_1.5fr_1.1fr_0.9fr_44px]";
const POSITION_LIST_ID = "admin-position-suggestions";

export function UserTable({
  users,
  canManageRoles,
  currentUserId,
}: {
  users: AdminUser[];
  canManageRoles: boolean;
  currentUserId: string;
}) {
  // The standard titles first, then anything already in use that isn't one.
  const suggestions = Array.from(
    new Set([...POSITION_SUGGESTIONS, ...users.map((user) => user.position.trim()).filter(Boolean)]),
  );
  return (
    <div className="border border-line bg-background">
      <datalist id={POSITION_LIST_ID}>
        {suggestions.map((position) => (
          <option key={position} value={position} />
        ))}
      </datalist>
      <div className={`t-eyebrow hidden gap-3 border-b border-foreground bg-muted px-4 py-2.5 text-foreground md:grid ${ROW_GRID}`}>
        <span>name</span>
        <span>email</span>
        <span>position</span>
        <span>access</span>
        <span />
      </div>
      {users.map((user, i) => {
        const isSelf = user.id === currentUserId;
        const isPending = user.status === "invited";
        return (
          <div
            key={user.id}
            className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors duration-200 ease-fluid hover:bg-muted/40 md:gap-3 ${ROW_GRID} ${
              i < users.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <span
              className={`col-start-1 truncate font-sans text-[14px] md:col-start-auto md:text-[13px] ${
                isPending ? "text-foreground/50" : "text-foreground"
              } ${isSelf ? "font-medium" : "font-normal"}`}
            >
              {isPending ? "Invite pending" : (user.full_name ?? "No name yet")}
            </span>
            <span className="col-start-1 truncate font-sans text-[12.5px] text-subtle md:col-start-auto">
              {user.email}
            </span>
            {canManageRoles ? (
              <span className="col-start-1 mt-1.5 min-w-0 md:col-start-auto md:mt-0">
                <PositionInput
                  userId={user.id}
                  position={user.position}
                  listId={POSITION_LIST_ID}
                  label={`Position for ${user.full_name ?? user.email}`}
                />
              </span>
            ) : (
              <span className="col-start-1 truncate font-sans text-[12.5px] text-subtle md:col-start-auto">
                {user.position}
              </span>
            )}
            {isPending ? (
              <span
                className="t-eyebrow col-start-1 mt-1.5 inline-flex items-center gap-1.5 justify-self-start border border-line px-2 py-0.5 text-foreground md:col-start-auto md:mt-0"
                title={`Will become ${user.role} on accept`}
              >
                <span aria-hidden="true" className="size-1.5 shrink-0 bg-amber" />
                pending · {user.role}
              </span>
            ) : isSelf ? (
              <span className="t-eyebrow col-start-1 mt-1.5 justify-self-start border border-foreground bg-mint px-2 py-0.5 text-foreground md:col-start-auto md:mt-0">
                {user.role}
              </span>
            ) : canManageRoles ? (
              <span className="col-start-1 mt-1.5 md:col-start-auto md:mt-0">
                <RoleSelect userId={user.id} role={user.role} />
              </span>
            ) : (
              <span className="t-eyebrow col-start-1 mt-1.5 justify-self-start border border-line px-2 py-0.5 text-subtle md:col-start-auto md:mt-0">
                {user.role}
              </span>
            )}
            <span className="col-start-2 row-span-4 row-start-1 flex justify-end md:col-start-auto md:row-span-1 md:row-start-auto">
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
