import { z } from "zod";

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
    BETTER_AUTH_URL: z.string().min(1, "BETTER_AUTH_URL is required"),
    STORAGE_PROVIDER: z.enum(["local", "b2"]).default("local"),
    STORAGE_ROOT: z.string().default("./storage"),
    MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(50),
    B2_BUCKET: z.string().optional(),
    B2_ENDPOINT: z.string().optional(),
    B2_REGION: z.string().optional(),
    B2_KEY_ID: z.string().optional(),
    B2_APPLICATION_KEY: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.STORAGE_PROVIDER !== "b2") return;
    (["B2_BUCKET", "B2_ENDPOINT", "B2_REGION", "B2_KEY_ID", "B2_APPLICATION_KEY"] as const).forEach(
      (key) => {
        if (!value[key]) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: `${key} is required when STORAGE_PROVIDER=b2`,
          });
        }
      }
    );
  });

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
  STORAGE_ROOT: process.env.STORAGE_ROOT,
  MAX_UPLOAD_SIZE_MB: process.env.MAX_UPLOAD_SIZE_MB,
  B2_BUCKET: process.env.B2_BUCKET,
  B2_ENDPOINT: process.env.B2_ENDPOINT,
  B2_REGION: process.env.B2_REGION,
  B2_KEY_ID: process.env.B2_KEY_ID,
  B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY,
});
