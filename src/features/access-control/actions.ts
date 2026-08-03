"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/features/auth/session";
import { getProjectForOwner } from "@/features/projects/service";
import {
  allowlistEmailSchema,
  visibilityFormSchema,
  type AllowlistFormState,
  type VisibilityFormState,
} from "@/features/access-control/schema";
import { hashProjectPassword } from "@/features/access-control/service";
import { prisma } from "@/lib/prisma";

export async function updateVisibilityAction(
  _prevState: VisibilityFormState,
  formData: FormData
): Promise<VisibilityFormState> {
  const session = await getSession();
  if (!session) {
    return { error: "You must be signed in." };
  }

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || projectId.length === 0) {
    return { error: "Invalid project." };
  }

  const project = await getProjectForOwner(session.user.id, projectId);
  if (!project) {
    return { error: "Project not found." };
  }

  const parsed = visibilityFormSchema.safeParse({
    visibility: formData.get("visibility"),
    password: formData.get("password") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { visibility, password } = parsed.data;

  let passwordHash: string | null = null;
  if (visibility === "PASSWORD") {
    passwordHash = password ? await hashProjectPassword(password) : project.passwordHash;
    if (!passwordHash) {
      return { error: "Set a password to enable password protection." };
    }
  }
  // Any other visibility clears a previously-set password outright, rather
  // than leaving an unused hash sitting in the database (FR-26: the owner
  // can "remove" a project's password, not just stop enforcing it).

  await prisma.project.update({
    where: { id: project.id },
    data: { visibility, passwordHash },
  });

  // Redirect (rather than just revalidatePath + return) so the client gets
  // an explicit fresh navigation instead of relying on the in-place RSC
  // merge — matches every other mutation action in this file/feature.
  revalidatePath(`/dashboard/projects/${project.id}`);
  redirect(`/dashboard/projects/${project.id}`);
}

export async function addAllowlistEmailAction(
  _prevState: AllowlistFormState,
  formData: FormData
): Promise<AllowlistFormState> {
  const session = await getSession();
  if (!session) {
    return { error: "You must be signed in." };
  }

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || projectId.length === 0) {
    return { error: "Invalid project." };
  }

  const project = await getProjectForOwner(session.user.id, projectId);
  if (!project) {
    return { error: "Project not found." };
  }

  const parsed = allowlistEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email." };
  }

  await prisma.projectAccess.upsert({
    where: { projectId_email: { projectId: project.id, email: parsed.data.email } },
    create: { projectId: project.id, email: parsed.data.email },
    update: {},
  });

  revalidatePath(`/dashboard/projects/${project.id}`);
  redirect(`/dashboard/projects/${project.id}`);
}

/**
 * Form-based like deleteProjectAction — the settings page only ever
 * renders this for the owning session, so a missing session/project just
 * redirects rather than surfacing an inline error.
 */
export async function removeAllowlistEmailAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const projectId = formData.get("projectId");
  const accessId = formData.get("accessId");
  if (typeof projectId !== "string" || typeof accessId !== "string") {
    redirect("/dashboard");
  }

  const project = await getProjectForOwner(session.user.id, projectId);
  if (!project) {
    redirect("/dashboard");
  }

  await prisma.projectAccess.deleteMany({
    where: { id: accessId, projectId: project.id },
  });

  revalidatePath(`/dashboard/projects/${project.id}`);
  redirect(`/dashboard/projects/${project.id}`);
}
