import { removeAllowlistEmailAction } from "@/features/access-control/actions";
import { AddAllowlistEmailForm } from "@/features/access-control/components/AddAllowlistEmailForm";

export function AllowlistManager({
  projectId,
  emails,
}: {
  projectId: string;
  emails: { id: string; email: string }[];
}) {
  return (
    <div className="space-y-4">
      <AddAllowlistEmailForm projectId={projectId} />

      {emails.length === 0 ? (
        <p className="text-sm text-muted-foreground">No emails allowlisted yet.</p>
      ) : (
        <ul className="space-y-2">
          {emails.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{entry.email}</span>
              <form action={removeAllowlistEmailAction}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="accessId" value={entry.id} />
                <button type="submit" className="text-xs font-medium text-destructive underline">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
