import { Readable } from "node:stream";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectVersionsCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import type { StorageService } from "@/features/storage/service";

export interface B2ProviderConfig {
  endpoint: string;
  region: string;
  bucket: string;
  keyId: string;
  applicationKey: string;
}

// S3 keys are opaque strings with no real directory traversal risk, but this
// mirrors LocalStorageProvider's guard (SECURITY.md documents traversal
// rejection as a provider-level contract) so the safety property holds
// regardless of which provider is active.
function normalizeKey(relPath: string): string {
  if (
    relPath.includes("\0") ||
    relPath.startsWith("/") ||
    relPath.split("/").some((segment) => segment === "..")
  ) {
    throw new Error(`Storage key escapes the project root: ${relPath}`);
  }
  return relPath;
}

export class B2StorageProvider implements StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: B2ProviderConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.keyId,
        secretAccessKey: config.applicationKey,
      },
    });
  }

  async upload(
    relPath: string,
    file: Buffer | ReadableStream,
    opts?: { contentType?: string }
  ): Promise<void> {
    const key = normalizeKey(relPath);
    const body = Buffer.isBuffer(file)
      ? file
      : Readable.fromWeb(file as unknown as NodeWebReadableStream);

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: opts?.contentType,
      },
    });
    await upload.done();
  }

  async replace(relPath: string, file: Buffer | ReadableStream): Promise<void> {
    await this.upload(relPath, file);
  }

  async read(relPath: string): Promise<Buffer> {
    const key = normalizeKey(relPath);
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await result.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }

  async download(relPath: string): Promise<ReadableStream> {
    const key = normalizeKey(relPath);
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return result.Body!.transformToWebStream() as unknown as ReadableStream;
  }

  async delete(relPath: string): Promise<void> {
    await this.purgeAllVersions(normalizeKey(relPath), false);
  }

  async deleteDirectory(relPath: string): Promise<void> {
    await this.purgeAllVersions(`${normalizeKey(relPath)}/`, true);
  }

  /**
   * B2 buckets keep file version history by default — an unversioned
   * `DeleteObject` only adds a "hide" marker on top of the current version;
   * the previous version's bytes stay in the bucket (and billed) until
   * something purges them. Deleting a project is meant to actually remove
   * the files, so this lists every version (and any existing hide markers)
   * under the key/prefix and deletes each one by its specific `VersionId`,
   * which permanently removes it instead of adding another marker.
   */
  private async purgeAllVersions(keyOrPrefix: string, isPrefix: boolean): Promise<void> {
    let keyMarker: string | undefined;
    let versionIdMarker: string | undefined;

    do {
      const listed = await this.client.send(
        new ListObjectVersionsCommand({
          Bucket: this.bucket,
          Prefix: keyOrPrefix,
          KeyMarker: keyMarker,
          VersionIdMarker: versionIdMarker,
        })
      );

      const entries = [...(listed.Versions ?? []), ...(listed.DeleteMarkers ?? [])]
        .filter((entry) => isPrefix || entry.Key === keyOrPrefix)
        .map((entry) => ({ Key: entry.Key!, VersionId: entry.VersionId }));

      if (entries.length > 0) {
        await this.client.send(
          new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: entries } })
        );
      }

      keyMarker = listed.IsTruncated ? listed.NextKeyMarker : undefined;
      versionIdMarker = listed.IsTruncated ? listed.NextVersionIdMarker : undefined;
    } while (keyMarker);
  }

  /** True only for a servable object — never true for a bare prefix, since S3 has no real directories. */
  async exists(relPath: string): Promise<boolean> {
    try {
      const key = normalizeKey(relPath);
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  async list(relPath: string): Promise<string[]> {
    const prefix = `${normalizeKey(relPath)}/`;
    const results: string[] = [];
    let continuationToken: string | undefined;

    do {
      const listed = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      );

      for (const obj of listed.Contents ?? []) {
        if (obj.Key) results.push(obj.Key.slice(prefix.length));
      }

      continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (continuationToken);

    return results;
  }
}
