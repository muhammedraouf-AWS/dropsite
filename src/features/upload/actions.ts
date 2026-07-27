"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/features/auth/session";
import { createProjectRecord } from "@/features/projects/service";
import { getStorageService } from "@/features/storage/service";
import { uploadMetaSchema, type UploadFormState } from "@/features/upload/schema";
import { buildUploadFiles, detectUploadKind, writeProjectFiles } from "@/features/upload/service";
import { ZipValidationError } from "@/features/upload/zip";
import { env } from "@/lib/env";

export async function uploadProjectAction(
  _prevState: UploadFormState,
  formData: FormData
): Promise<UploadFormState> {
  const session = await getSession();
  if (!session) {
    return { error: "You must be signed in to upload a project." };
  }

  const parsedName = uploadMetaSchema.safeParse({ name: formData.get("name") });
  if (!parsedName.success) {
    return { error: parsedName.error.issues[0]?.message ?? "Invalid project name." };
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

  const projectId = randomUUID();
  const storagePath = `${session.user.id}/${projectId}`;
  const storage = getStorageService();

  try {
    await writeProjectFiles(storage, storagePath, files);
  } catch {
    await storage.deleteDirectory(storagePath).catch(() => {});
    return { error: "Could not store the uploaded files. Please try again." };
  }

  try {
    await createProjectRecord({
      id: projectId,
      userId: session.user.id,
      name: parsedName.data.name,
      storagePath,
    });
  } catch {
    await storage.deleteDirectory(storagePath).catch(() => {});
    return { error: "Could not save the project. Please try again." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
