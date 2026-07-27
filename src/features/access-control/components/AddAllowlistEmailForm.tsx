"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addAllowlistEmailAction } from "@/features/access-control/actions";
import { initialAllowlistFormState } from "@/features/access-control/schema";

export function AddAllowlistEmailForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(
    addAllowlistEmailAction,
    initialAllowlistFormState
  );

  return (
    <form action={formAction} className="flex items-start gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex-1 space-y-1">
        <Input name="email" type="email" placeholder="person@example.com" disabled={pending} />
        {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add"}
      </Button>
    </form>
  );
}
