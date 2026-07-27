import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProjectList } from "@/features/projects/components/ProjectList";
import { listProjectsForUser } from "@/features/projects/service";
import { getSession } from "@/features/auth/session";

export default async function DashboardPage() {
  const session = await getSession();
  const projects = session ? await listProjectsForUser(session.user.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Your hosted static sites.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/dashboard/upload" />}>
          Upload
        </Button>
      </div>
      <ProjectList projects={projects} />
    </div>
  );
}
