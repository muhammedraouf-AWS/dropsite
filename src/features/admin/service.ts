import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/session";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

function adminEmailSet(): Set<string> {
  return new Set(
    (env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email: string): boolean {
  return adminEmailSet().has(email.toLowerCase());
}

/**
 * Admin status is env-configured (`ADMIN_EMAILS`), not a DB column — there's
 * no self-service way to grant it, and nothing in the UI can accidentally
 * escalate a user. Redirects non-admins to `/dashboard` rather than 404ing,
 * since this is an internal operator page, not something to hide the
 * existence of from other authenticated users.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!isAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }
  return session;
}

export function listAllUsersWithProjectCounts() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });
}

export function listAllProjectsWithOwners() {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
}
