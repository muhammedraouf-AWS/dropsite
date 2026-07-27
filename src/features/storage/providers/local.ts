import { createWriteStream, createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import type { StorageService } from "@/features/storage/service";

export class LocalStorageProvider implements StorageService {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(/* turbopackIgnore: true */ process.cwd(), root);
  }

  private resolve(relPath: string): string {
    const resolved = path.resolve(this.root, relPath);
    if (resolved !== this.root && !resolved.startsWith(this.root + path.sep)) {
      throw new Error(`Resolved storage path escapes the storage root: ${relPath}`);
    }
    return resolved;
  }

  async upload(
    relPath: string,
    file: Buffer | ReadableStream,
    _opts?: { contentType?: string }
  ): Promise<void> {
    const target = this.resolve(relPath);
    await fs.mkdir(path.dirname(target), { recursive: true });

    if (Buffer.isBuffer(file)) {
      await fs.writeFile(target, file);
      return;
    }

    const nodeStream = Readable.fromWeb(file as unknown as NodeWebReadableStream);
    await pipeline(nodeStream, createWriteStream(target));
  }

  async replace(relPath: string, file: Buffer | ReadableStream): Promise<void> {
    await this.upload(relPath, file);
  }

  async read(relPath: string): Promise<Buffer> {
    return fs.readFile(this.resolve(relPath));
  }

  async download(relPath: string): Promise<ReadableStream> {
    const target = this.resolve(relPath);
    return Readable.toWeb(createReadStream(target)) as unknown as ReadableStream;
  }

  async delete(relPath: string): Promise<void> {
    await fs.rm(this.resolve(relPath), { force: true });
  }

  async deleteDirectory(relPath: string): Promise<void> {
    await fs.rm(this.resolve(relPath), { recursive: true, force: true });
  }

  async exists(relPath: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(relPath));
      return true;
    } catch {
      return false;
    }
  }

  async list(relPath: string): Promise<string[]> {
    const target = this.resolve(relPath);
    try {
      return await fs.readdir(target, { recursive: true });
    } catch {
      return [];
    }
  }
}
