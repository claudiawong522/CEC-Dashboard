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
  const [role, setRole] = useState<Role>("view");
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
      className="flex flex-col gap-2.5 rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper p-[15px]"
    >
      <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
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
            className="w-auto gap-1.5 rounded-[20px] border-line-input bg-page px-[9px] py-[5px] font-mono text-[9.5px] tracking-[0.1em] text-body uppercase transition-colors duration-200 hover:border-[rgba(35,32,28,0.32)] hover:text-ink [&_svg]:text-faint"
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
      <span className="font-sans text-[11.5px] text-faint">
        No email goes out. Tell them to sign in with their Cornell Google account at this site,
        and the access you picked is already waiting.
      </span>
    </form>
  );
}
