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
        className="w-auto justify-self-start gap-1.5 rounded-[20px] border-line-input bg-page px-[9px] py-[5px] font-mono text-[9.5px] tracking-[0.1em] text-body uppercase transition-colors duration-200 hover:border-[rgba(35,32,28,0.32)] hover:text-ink [&_svg]:text-faint"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-card border-line bg-paper shadow-menu ring-0">
        <SelectItem value="view" className="font-sans text-[12.5px] focus:bg-wash focus:text-ink">
          View
        </SelectItem>
        <SelectItem value="edit" className="font-sans text-[12.5px] focus:bg-wash focus:text-ink">
          Edit
        </SelectItem>
        <SelectItem value="admin" className="font-sans text-[12.5px] focus:bg-wash focus:text-ink">
          Admin
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
