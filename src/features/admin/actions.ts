"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/features/admin/service";
import { getStorageService } from "@/features/storage/service";
import { prisma } from "@/lib/prisma";

export async function adminDeleteProjectAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || projectId.length === 0) {
    redirect("/dashboard/admin");
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    redirect("/dashboard/admin");
  }

  const storage = getStorageService();
  await storage.deleteDirectory(project.storagePath).catch(() => {});
  await prisma.project.delete({ where: { id: project.id } });

  revalidatePath("/dashboard/admin");
  redirect("/dashboard/admin");
}

/**
 * Cascades to the user's sessions/accounts/projects at the DB level
 * (`onDelete: Cascade` in schema.prisma), but storage isn't part of that
 * transaction — each project's files are removed explicitly first.
 */
export async function adminDeleteUserAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();

  const userId = formData.get("userId");
  if (typeof userId !== "string" || userId.length === 0) {
    redirect("/dashboard/admin");
  }

  if (userId === session.user.id) {
    // Refuse rather than let an admin lock themselves out mid-session.
    redirect("/dashboard/admin");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { projects: true },
  });
  if (!user) {
    redirect("/dashboard/admin");
  }

  const storage = getStorageService();
  await Promise.all(
    user.projects.map((project) => storage.deleteDirectory(project.storagePath).catch(() => {}))
  );
  await prisma.user.delete({ where: { id: user.id } });

  revalidatePath("/dashboard/admin");
  redirect("/dashboard/admin");
}
