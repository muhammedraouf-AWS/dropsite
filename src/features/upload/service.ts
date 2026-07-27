import type { StorageService } from "@/features/storage/service";
import { extractZipEntries, ZipValidationError, type ExtractedFile } from "@/features/upload/zip";

export type UploadKind = "html" | "zip";

function isZipSignature(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  const signature = buffer.readUInt32LE(0);
  // Local file header (PK\x03\x04) or end-of-central-directory (PK\x05\x06, empty archive).
  return signature === 0x04034b50 || signature === 0x06054b50;
}

export function detectUploadKind(fileName: string, buffer: Buffer): UploadKind | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".zip")) {
    return isZipSignature(buffer) ? "zip" : null;
  }
  if (lower.endsWith(".html")) {
    return "html";
  }
  return null;
}

function detectSingleRootFolder(files: ExtractedFile[]): string | null {
  if (files.length === 0) return null;
  const [first, ...rest] = files.map((f) => f.relativePath.split("/")[0]);
  const allSameFirstSegment = rest.every((segment) => segment === first);
  const allNested = files.every((f) => f.relativePath.includes("/"));
  return allSameFirstSegment && allNested ? first : null;
}

/**
 * FR-14: the archive must contain index.html at its true root, or at the
 * root of a single top-level folder (e.g. exporting a ZIP from a folder
 * named "my-site/" that wraps everything). Strips that wrapper prefix so
 * files land directly under the project's storage path either way.
 */
export function resolveZipRoot(files: ExtractedFile[]): ExtractedFile[] {
  const hasRootIndex = files.some((f) => f.relativePath === "index.html");
  if (hasRootIndex) return files;

  const rootFolder = detectSingleRootFolder(files);
  if (rootFolder) {
    const prefix = `${rootFolder}/`;
    const hasNestedIndex = files.some((f) => f.relativePath === `${prefix}index.html`);
    if (hasNestedIndex) {
      return files.map((f) => ({ ...f, relativePath: f.relativePath.slice(prefix.length) }));
    }
  }

  throw new ZipValidationError("The ZIP archive must contain an index.html file at its root.");
}

export async function buildUploadFiles(
  kind: UploadKind,
  buffer: Buffer,
  maxTotalUncompressedBytes: number
): Promise<ExtractedFile[]> {
  if (kind === "html") {
    return [{ relativePath: "index.html", data: buffer }];
  }
  const entries = await extractZipEntries(buffer, maxTotalUncompressedBytes);
  return resolveZipRoot(entries);
}

export async function writeProjectFiles(
  storage: StorageService,
  storagePath: string,
  files: ExtractedFile[]
): Promise<void> {
  for (const file of files) {
    await storage.upload(`${storagePath}/${file.relativePath}`, file.data);
  }
}
