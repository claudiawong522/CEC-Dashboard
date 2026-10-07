"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteUser } from "@/lib/actions/admin";
import type { Role } from "@/lib/auth/getSession";

import { ROLE_LABELS } from "@/lib/utils/role-labels";
export function InviteForm() {
  const [email, setEmail] = useState("");
  // Edit, not view: a member is a member, and the read-only default was how
  // every invite so far ended up read-only. View is still selectable for an
  // alum or an outside collaborator who should only look.
  const [role, setRole] = useState<Role>("edit");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    startTransition(async () => {
      try {
        const result = await inviteUser(trimmed, role);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        // Re-inviting someone who was removed puts them straight back without
        // sending mail, and says so in its own message.
        toast.success(result.message ?? `Invite sent to ${trimmed}`);
        setEmail("");
        setRole("view");
      } catch {
        toast.error("Couldn't send invite");
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-2.5 border border-line bg-background p-4 shadow-soft"
    >
      <span className="t-eyebrow text-foreground/50">
        invite someone
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="email"
          required
          placeholder="name@cornell.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          className="min-w-[220px] flex-1"
        />
        <Select items={ROLE_LABELS} value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger
            disabled={isPending}
            className="t-eyebrow w-auto min-h-0 gap-1.5 border-line bg-background px-2 py-1 text-subtle hover:border-foreground hover:text-foreground data-[size=default]:min-h-0 [&_svg]:text-foreground/50"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="view">
              View
            </SelectItem>
            <SelectItem value="edit">
              Edit
            </SelectItem>
            <SelectItem value="admin">
              Admin
            </SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={!email.trim()} loading={isPending}>
          {!isPending && <UserPlus data-icon="inline-start" />}
          {isPending ? "Adding…" : "Give access"}
        </Button>
      </div>
      {/* No email is sent. Access is granted the moment this succeeds, and the
          person picks it up by signing in, so the copy has to say that plainly
          or an admin sits waiting for a delivery that never happens. */}
      <span className="font-sans text-[12px] text-foreground/50">
        No email goes out. Tell them to sign in with their Cornell Google account at this site,
        and the access you picked is already waiting.
      </span>
    </form>
  );
}
