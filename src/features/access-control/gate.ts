import type { NextRequest } from "next/server";
import { getSession } from "@/features/auth/session";
import {
  isEmailAllowlisted,
  projectAccessCookieName,
  verifyProjectAccessToken,
} from "@/features/access-control/service";

interface GatedProject {
  id: string;
  userId: string;
  visibility: "PUBLIC" | "PASSWORD" | "ALLOWLIST" | "PRIVATE";
  passwordHash: string | null;
}

export type AccessResult =
  | { kind: "allow" }
  | { kind: "password-prompt" }
  | { kind: "access-denied"; canSignIn: boolean }
  | { kind: "not-found" };

/**
 * Decides whether a request can view a project's site, for every request
 * (index and every asset) — see project-context/SECURITY.md. Deliberately
 * returns the *same* `not-found` result for both a nonexistent slug and a
 * private project a stranger tries to view, so the two are indistinguishable
 * (no confirming a private project's existence).
 */
export async function resolveAccess(
  project: GatedProject,
  request: NextRequest
): Promise<AccessResult> {
  if (project.visibility === "PUBLIC") {
    return { kind: "allow" };
  }

  const session = await getSession();
  if (session && session.user.id === project.userId) {
    return { kind: "allow" };
  }

  if (project.visibility === "PASSWORD") {
    if (!project.passwordHash) return { kind: "allow" };
    const token = request.cookies.get(projectAccessCookieName(project.id))?.value;
    if (token && verifyProjectAccessToken(project.id, project.passwordHash, token)) {
      return { kind: "allow" };
    }
    return { kind: "password-prompt" };
  }

  if (project.visibility === "PRIVATE") {
    return { kind: "not-found" };
  }

  // ALLOWLIST
  if (!session) {
    return { kind: "access-denied", canSignIn: true };
  }
  const allowed = await isEmailAllowlisted(project.id, session.user.email);
  return allowed ? { kind: "allow" } : { kind: "access-denied", canSignIn: false };
}
