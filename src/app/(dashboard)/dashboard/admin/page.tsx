import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminProjectList } from "@/features/admin/components/AdminProjectList";
import { AdminUserList } from "@/features/admin/components/AdminUserList";
import {
  listAllProjectsWithOwners,
  listAllUsersWithProjectCounts,
  requireAdmin,
} from "@/features/admin/service";

export default async function AdminPage() {
  const session = await requireAdmin();
  const [users, projects] = await Promise.all([
    listAllUsersWithProjectCounts(),
    listAllProjectsWithOwners(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Every user and project across DropSite.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>Deleting a user removes all of their projects too.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminUserList users={users} currentUserId={session.user.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projects ({projects.length})</CardTitle>
          <CardDescription>Every hosted site, across every user.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminProjectList projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
