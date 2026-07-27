import { getProjectBySlug } from "@/features/projects/service";
import { getContentType } from "@/features/sites/content-type";
import { getStorageService } from "@/features/storage/service";

function notFound(): Response {
  return new Response("Not found", { status: 404 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; path?: string[] }> }
) {
  const { slug, path } = await params;

  const project = await getProjectBySlug(slug);
  if (!project) {
    return notFound();
  }

  const relativeAssetPath = path && path.length > 0 ? path.join("/") : "index.html";
  const storage = getStorageService();
  const assetStoragePath = `${project.storagePath}/${relativeAssetPath}`;

  // `exists` also rejects the traversal case (a resolved path outside the
  // storage root throws inside the provider, which surfaces here as
  // `false`) and directories, so a single check covers both concerns.
  if (!(await storage.exists(assetStoragePath))) {
    return notFound();
  }

  try {
    const stream = await storage.download(assetStoragePath);
    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": getContentType(relativeAssetPath) },
    });
  } catch {
    return notFound();
  }
}
