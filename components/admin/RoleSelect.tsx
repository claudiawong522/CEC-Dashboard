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

export function RoleSelect({ userId, role }: { userId: string; role: Role }) {
  const [value, setValue] = useState<Role>(role);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: Role) {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      try {
        await updateUserRole(userId, next);
        toast.success("Role updated");
      } catch {
        setValue(previous);
        toast.error("Couldn't update role");
      }
    });
  }

  return (
    <Select value={value} onValueChange={(v) => handleChange(v as Role)}>
      <SelectTrigger disabled={isPending} className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="view">View</SelectItem>
        <SelectItem value="edit">Edit</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
