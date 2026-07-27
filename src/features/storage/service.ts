import { LocalStorageProvider } from "@/features/storage/providers/local";
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
    instance = new LocalStorageProvider(env.STORAGE_ROOT);
  }
  return instance;
}
