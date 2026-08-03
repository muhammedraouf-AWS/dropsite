import { LocalStorageProvider } from "@/features/storage/providers/local";
import { B2StorageProvider } from "@/features/storage/providers/b2";
import { env } from "@/lib/env";

export interface StorageService {
  upload(
    path: string,
    file: Buffer | ReadableStream,
    opts?: { contentType?: string }
  ): Promise<void>;
  read(path: string): Promise<Buffer>;
  download(path: string): Promise<ReadableStream>;
  replace(path: string, file: Buffer | ReadableStream): Promise<void>;
  delete(path: string): Promise<void>;
  deleteDirectory(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  list(path: string): Promise<string[]>;
}

let instance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!instance) {
    instance =
      env.STORAGE_PROVIDER === "b2"
        ? new B2StorageProvider({
            endpoint: env.B2_ENDPOINT!,
            region: env.B2_REGION!,
            bucket: env.B2_BUCKET!,
            keyId: env.B2_KEY_ID!,
            applicationKey: env.B2_APPLICATION_KEY!,
          })
        : new LocalStorageProvider(env.STORAGE_ROOT);
  }
  return instance;
}
