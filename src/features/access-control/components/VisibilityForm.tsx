"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateVisibilityAction } from "@/features/access-control/actions";
import { initialVisibilityFormState } from "@/features/access-control/schema";

type Visibility = "PUBLIC" | "PASSWORD" | "ALLOWLIST" | "PRIVATE";

const OPTIONS: { value: Visibility; label: string; description: string }[] = [
  { value: "PUBLIC", label: "Public", description: "Anyone with the link can view it." },
  {
    value: "PASSWORD",
    label: "Password protected",
    description: "Visitors enter a password once per browser session.",
  },
  {
    value: "ALLOWLIST",
    label: "Email allowlist",
    description: "Only signed-in visitors on your list can view it.",
  },
  { value: "PRIVATE", label: "Private", description: "Only you can view it." },
];

export function VisibilityForm({
  projectId,
  currentVisibility,
  hasPassword,
}: {
  projectId: string;
  currentVisibility: Visibility;
  hasPassword: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateVisibilityAction,
    initialVisibilityFormState
  );
  // Seeded from `currentVisibility` and never needs to re-sync afterward:
  // `updateVisibilityAction` redirects back to this page on success, so a
  // successful save always remounts this component with the fresh prop.
  const [visibility, setVisibility] = useState<Visibility>(currentVisibility);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />

      <div className="space-y-3">
        {OPTIONS.map((option) => (
          <label key={option.value} className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              value={option.value}
              checked={visibility === option.value}
              onChange={() => setVisibility(option.value)}
              disabled={pending}
              suppressHydrationWarning
              className="mt-1"
            />
            <span>
              <span className="font-medium">{option.label}</span>
              <span className="block text-xs text-muted-foreground">{option.description}</span>
            </span>
          </label>
        ))}
      </div>

      {visibility === "PASSWORD" && (
        <div className="space-y-2">
          <Label htmlFor="password">
            {hasPassword ? "New password" : "Password"}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={hasPassword ? "Leave blank to keep current password" : "Set a password"}
            disabled={pending}
          />
        </div>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
