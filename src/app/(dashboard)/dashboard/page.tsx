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
        {/* Upload flow ships in Phase 2 — see project-context/ROADMAP.md */}
        <Button disabled title="Upload arrives in Phase 2">
          Upload
        </Button>
      </div>
      <ProjectList projects={projects} />
    </div>
  );
}
