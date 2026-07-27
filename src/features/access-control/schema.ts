import { z } from "zod";

export const visibilitySchema = z.enum(["PUBLIC", "PASSWORD", "ALLOWLIST", "PRIVATE"]);

export const visibilityFormSchema = z.object({
  visibility: visibilitySchema,
  password: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .max(200)
    .optional(),
});

export type VisibilityFormState = { error: string | null };
export const initialVisibilityFormState: VisibilityFormState = { error: null };

export const allowlistEmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export type AllowlistFormState = { error: string | null };
export const initialAllowlistFormState: AllowlistFormState = { error: null };
