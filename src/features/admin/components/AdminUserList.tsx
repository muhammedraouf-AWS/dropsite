"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminDeleteUserAction } from "@/features/admin/actions";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  _count: { projects: number };
};

export function AdminUserList({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No users yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="grid gap-3">
      {users.map((user) => (
        <li key={user.id}>
          <Card>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">
                  {user.name || user.email}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {user._count.projects} project{user._count.projects === 1 ? "" : "s"} · joined{" "}
                  {user.createdAt.toLocaleDateString()}
                </p>
              </div>
              {user.id !== currentUserId && (
                <form
                  action={adminDeleteUserAction}
                  onSubmit={(event) => {
                    if (
                      !window.confirm(
                        `Delete ${user.email} and all of their projects? This cannot be undone.`
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="userId" value={user.id} />
                  <Button type="submit" variant="destructive" size="sm">
                    Delete user
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
