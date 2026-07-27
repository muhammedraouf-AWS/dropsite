"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/features/auth/session";
import { getProjectForOwner } from "@/features/projects/service";
import type { ReplaceFormState } from "@/features/projects/schema";
import { getStorageService } from "@/features/storage/service";
import { buildUploadFiles, detectUploadKind, writeProjectFiles } from "@/features/upload/service";
import { ZipValidationError } from "@/features/upload/zip";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

/**
 * Form-based (not onClick-invoked) so it gets the same progressive-
 * enhancement behavior as upload/replace. The settings page only ever
 * renders this for the owning session (`getProjectForOwner` at page load),
 * so a missing session/project here just redirects rather than surfacing
 * an inline error — there's no realistic path for that to happen mid-use.
 */
export async function deleteProjectAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || projectId.length === 0) {
    redirect("/dashboard");
  }

  const project = await getProjectForOwner(session.user.id, projectId);
  if (!project) {
    redirect("/dashboard");
  }

  const storage = getStorageService();
  await storage.deleteDirectory(project.storagePath).catch(() => {});
  await prisma.project.delete({ where: { id: project.id } });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function replaceProjectAction(
  _prevState: ReplaceFormState,
  formData: FormData
): Promise<ReplaceFormState> {
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

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an .html file or a .zip archive to upload." };
  }

  const maxBytes = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { error: `File exceeds the ${env.MAX_UPLOAD_SIZE_MB}MB upload limit.` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = detectUploadKind(file.name, buffer);
  if (!kind) {
    return { error: "Only .html files and .zip archives are supported." };
  }

  let files;
  try {
    files = await buildUploadFiles(kind, buffer, maxBytes);
  } catch (error) {
    if (error instanceof ZipValidationError) {
      return { error: error.message };
    }
    return { error: "Could not process the uploaded file." };
  }

  const storage = getStorageService();
  // Clear the previous deployment first so stale files never linger
  // alongside the new ones (project-context/FILE_STORAGE.md).
  await storage.deleteDirectory(project.storagePath).catch(() => {});

  try {
    await writeProjectFiles(storage, project.storagePath, files);
  } catch {
    return { error: "Could not store the uploaded files. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${project.id}`);
  redirect(`/dashboard/projects/${project.id}`);
}
