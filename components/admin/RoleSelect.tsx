"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserRole } from "@/lib/actions/admin";
import type { Role } from "@/lib/auth/getSession";

import { ROLE_LABELS } from "@/lib/utils/role-labels";
export function RoleSelect({ userId, role }: { userId: string; role: Role }) {
  const [value, setValue] = useState<Role>(role);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: Role) {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      try {
        const result = await updateUserRole(userId, next);
        if (!result.ok) {
          setValue(previous);
          toast.error(result.message);
          return;
        }
        toast.success("Role updated");
      } catch {
        setValue(previous);
        toast.error("Couldn't update role");
      }
    });
  }

  return (
    <Select items={ROLE_LABELS} value={value} onValueChange={(v) => handleChange(v as Role)}>
      <SelectTrigger
        disabled={isPending}
        className="t-eyebrow w-auto min-h-0 justify-self-start gap-1.5 border-line bg-background px-2 py-1 text-subtle hover:border-foreground hover:text-foreground data-[size=default]:min-h-0 [&_svg]:text-foreground/50"
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
  );
}
