import { createHmac, timingSafeEqual } from "node:crypto";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

/** Reuses Better Auth's own scrypt-based hashing (project-context/SECURITY.md). */
export async function hashProjectPassword(password: string): Promise<string> {
  return hashPassword(password);
}

export async function verifyProjectPassword(password: string, hash: string): Promise<boolean> {
  return verifyPassword({ hash, password });
}

export function projectAccessCookieName(projectId: string): string {
  return `dropsite_pw_${projectId}`;
}

function computeAccessToken(projectId: string, passwordHash: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`dropsite-project-access:${projectId}:${passwordHash}`)
    .digest("hex");
}

/**
 * Signs a per-project access token from the project's *current*
 * passwordHash, so changing or removing the password automatically
 * invalidates every previously-issued cookie with no server-side session
 * store required.
 */
export function signProjectAccessToken(projectId: string, passwordHash: string): string {
  return computeAccessToken(projectId, passwordHash);
}

export function verifyProjectAccessToken(
  projectId: string,
  passwordHash: string,
  token: string
): boolean {
  try {
    const expected = Buffer.from(computeAccessToken(projectId, passwordHash), "hex");
    const actual = Buffer.from(token, "hex");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function isEmailAllowlisted(projectId: string, email: string): Promise<boolean> {
  const entry = await prisma.projectAccess.findUnique({
    where: { projectId_email: { projectId, email } },
  });
  return entry !== null;
}

export function listAllowlistedEmails(projectId: string) {
  return prisma.projectAccess.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}
