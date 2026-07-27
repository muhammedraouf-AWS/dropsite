import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/features/auth/session";
import { AllowlistManager } from "@/features/access-control/components/AllowlistManager";
import { VisibilityForm } from "@/features/access-control/components/VisibilityForm";
import { listAllowlistedEmails } from "@/features/access-control/service";
import { DeleteProjectForm } from "@/features/projects/components/DeleteProjectForm";
import { ReplaceForm } from "@/features/projects/components/ReplaceForm";
import { getProjectForOwner } from "@/features/projects/service";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const project = await getProjectForOwner(session.user.id, id);
  if (!project) {
    notFound();
  }

  const allowlistedEmails = await listAllowlistedEmails(project.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        <Link
          href={`/sites/${project.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-muted-foreground underline"
        >
          /sites/{project.slug}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Replace deployment</CardTitle>
          <CardDescription>
            Upload a new file or archive to replace the current deployment. The
            URL stays the same.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReplaceForm projectId={project.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access control</CardTitle>
          <CardDescription>
            Choose who can view this site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <VisibilityForm
            projectId={project.id}
            currentVisibility={project.visibility}
            hasPassword={project.passwordHash !== null}
          />
          {project.visibility === "ALLOWLIST" && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">Allowlisted emails</p>
              <AllowlistManager projectId={project.id} emails={allowlistedEmails} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>
            Deleting a project removes its files and its public URL permanently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteProjectForm projectId={project.id} />
        </CardContent>
      </Card>
    </div>
  );
}
