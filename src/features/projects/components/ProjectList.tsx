import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { Project } from "@/generated/prisma/client";

export function ProjectList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-sm font-medium">No projects yet</p>
          <p className="text-sm text-muted-foreground">
            Upload an HTML file or a ZIP archive to get your first public URL.
          </p>
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
              </div>
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="text-sm font-medium underline"
              >
                Settings
              </Link>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
