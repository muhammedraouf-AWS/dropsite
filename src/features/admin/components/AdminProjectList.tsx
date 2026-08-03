"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminDeleteProjectAction } from "@/features/admin/actions";

type AdminProject = {
  id: string;
  name: string;
  slug: string;
  visibility: "PUBLIC" | "PASSWORD" | "ALLOWLIST" | "PRIVATE";
  createdAt: Date;
  user: { email: string; name: string | null };
};

export function AdminProjectList({ projects }: { projects: AdminProject[] }) {
  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No projects yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="grid gap-3">
      {projects.map((project) => (
        <li key={project.id}>
          <Card>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{project.name}</p>
                <a
                  href={`/sites/${project.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-muted-foreground underline"
                >
                  /sites/{project.slug}
                </a>
                <p className="text-xs text-muted-foreground">
                  {project.user.email} · {project.visibility.toLowerCase()} · created{" "}
                  {project.createdAt.toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <form
                  action={adminDeleteProjectAction}
                  onSubmit={(event) => {
                    if (
                      !window.confirm(`Delete "${project.name}"? This cannot be undone.`)
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="projectId" value={project.id} />
                  <Button type="submit" variant="destructive" size="sm">
                    Delete
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
