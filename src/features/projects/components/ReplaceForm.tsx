"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { replaceProjectAction } from "@/features/projects/actions";
import { initialReplaceFormState } from "@/features/projects/schema";

export function ReplaceForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(
    replaceProjectAction,
    initialReplaceFormState
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="space-y-2">
        <Label htmlFor="file">HTML file or ZIP archive</Label>
        <Input
          id="file"
          name="file"
          type="file"
          accept=".html,.zip"
          required
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">
          Replaces every file in this deployment. The public URL stays the same.
        </p>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Replacing..." : "Replace deployment"}
      </Button>
    </form>
  );
}
