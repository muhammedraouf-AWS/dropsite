"use client";

import { Button } from "@/components/ui/button";
import { deleteProjectAction } from "@/features/projects/actions";

export function DeleteProjectForm({ projectId }: { projectId: string }) {
  return (
    <form
      action={deleteProjectAction}
      onSubmit={(event) => {
        if (!window.confirm("Delete this project? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <Button type="submit" variant="destructive">
        Delete project
      </Button>
    </form>
  );
}
