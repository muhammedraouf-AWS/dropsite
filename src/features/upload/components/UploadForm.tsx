"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadProjectAction } from "@/features/upload/actions";
import { initialUploadFormState } from "@/features/upload/schema";

export function UploadForm() {
  const [state, formAction, pending] = useActionState(
    uploadProjectAction,
    initialUploadFormState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Project name</Label>
        <Input id="name" name="name" maxLength={100} required disabled={pending} />
      </div>

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
          Upload a single .html file, or a .zip archive containing an index.html
          at its root.
        </p>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Uploading..." : "Upload"}
      </Button>
    </form>
  );
}
