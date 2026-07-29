import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RoleSelect } from "@/components/admin/RoleSelect";
import type { Profile } from "@/lib/auth/getSession";

export function UserTable({
  users,
  canManageRoles,
}: {
  users: Profile[];
  canManageRoles: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Access level</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.full_name ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">{user.email}</TableCell>
            <TableCell>
              {canManageRoles ? (
                <RoleSelect userId={user.id} role={user.role} />
              ) : (
                <Badge variant="outline" className="capitalize">
                  {user.role}
                </Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
