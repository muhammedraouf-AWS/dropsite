import { z } from "zod";

export const uploadMetaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(100, "Project name must be 100 characters or fewer"),
});

export type UploadMetaInput = z.infer<typeof uploadMetaSchema>;

export type UploadFormState = { error: string | null };

export const initialUploadFormState: UploadFormState = { error: null };
