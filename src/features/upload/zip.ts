import path from "node:path";
import yauzl from "yauzl";

export class ZipValidationError extends Error {}

export interface ExtractedFile {
  relativePath: string;
  data: Buffer;
}

const MAX_ENTRY_COUNT = 5000;
const MAX_COMPRESSION_RATIO = 100;
const ENTRY_SIZE_SLACK_BYTES = 1024;

/**
 * Symlink entries are stored as regular ZIP entries whose external file
 * attributes encode a Unix `S_IFLNK` mode in the high 16 bits.
 */
function isSymlinkEntry(entry: yauzl.Entry): boolean {
  const unixMode = entry.externalFileAttributes >>> 16;
  return (unixMode & 0xf000) === 0xa000;
}

/**
 * Some Windows-native tools (e.g. PowerShell's Compress-Archive) write
 * entries with backslash separators, which is off-spec but common in the
 * wild — normalize those before validating, rather than rejecting them
 * outright the way yauzl's own `strictFileNames` option would.
 */
function normalizeZipEntryPath(fileName: string): string | null {
  if (fileName.includes("\0")) return null;
  const posixPath = fileName.replace(/\\/g, "/");
  if (/^[a-zA-Z]:/.test(posixPath)) return null; // drive-letter absolute path
  if (path.posix.isAbsolute(posixPath)) return null;
  const normalized = path.posix.normalize(posixPath);
  if (normalized === ".." || normalized.startsWith("../")) return null;
  return normalized;
}

async function streamToBuffer(stream: NodeJS.ReadableStream, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    total += chunk.length;
    if (total > maxBytes) {
      throw new ZipValidationError("Archive entry decompressed larger than declared.");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Extracts a ZIP buffer into an in-memory file list, guarding against
 * zip-slip (path traversal), symlinks, and decompression bombs. See
 * project-context/SECURITY.md for the hardening contract this implements.
 */
export async function extractZipEntries(
  buffer: Buffer,
  maxTotalUncompressedBytes: number
): Promise<ExtractedFile[]> {
  let zipfile;
  try {
    // strictFileNames is intentionally left at its default (false): it
    // would hard-reject backslash-separated entries instead of letting us
    // normalize them, so path safety is fully owned by
    // normalizeZipEntryPath below.
    zipfile = await yauzl.fromBufferPromise(buffer, { lazyEntries: true });
  } catch {
    throw new ZipValidationError("The uploaded file is not a valid ZIP archive.");
  }

  const files: ExtractedFile[] = [];
  let entryCount = 0;
  let totalUncompressed = 0;

  try {
    for await (const entry of zipfile.eachEntry()) {
      entryCount += 1;
      if (entryCount > MAX_ENTRY_COUNT) {
        throw new ZipValidationError("Archive has too many entries.");
      }

      const isDirectory = entry.fileName.endsWith("/");
      const relativePath = normalizeZipEntryPath(entry.fileName);
      if (relativePath === null) {
        throw new ZipValidationError("Archive contains an unsafe file path.");
      }

      if (isDirectory) continue;

      if (isSymlinkEntry(entry)) {
        throw new ZipValidationError("Archive contains symlinks, which are not allowed.");
      }

      const ratio =
        entry.compressedSize === 0
          ? entry.uncompressedSize
          : entry.uncompressedSize / entry.compressedSize;
      if (ratio > MAX_COMPRESSION_RATIO) {
        throw new ZipValidationError("Archive failed a decompression-safety check.");
      }

      totalUncompressed += entry.uncompressedSize;
      if (totalUncompressed > maxTotalUncompressedBytes) {
        throw new ZipValidationError("Archive is too large once decompressed.");
      }

      const stream = await zipfile.openReadStreamPromise(entry);
      const data = await streamToBuffer(stream, entry.uncompressedSize + ENTRY_SIZE_SLACK_BYTES);
      files.push({ relativePath, data });
    }
  } catch (error) {
    // yauzl's own `strictFileNames` check (zip-slip / absolute-path /
    // backslash entries) throws a plain Error here, ahead of our checks
    // above — normalize it to the same error type callers expect.
    if (error instanceof ZipValidationError) throw error;
    throw new ZipValidationError("Archive contains an invalid or unsafe entry.");
  } finally {
    zipfile.close();
  }

  return files;
}
