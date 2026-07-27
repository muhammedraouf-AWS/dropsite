import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  projectAccessCookieName,
  signProjectAccessToken,
  verifyProjectPassword,
} from "@/features/access-control/service";
import { resolveAccess } from "@/features/access-control/gate";
import { renderAccessDeniedPage, renderPasswordPromptPage } from "@/features/access-control/pages";
import { getProjectBySlug } from "@/features/projects/service";
import { getContentType } from "@/features/sites/content-type";
import { injectBaseTag } from "@/features/sites/inject-base-tag";
import { getStorageService } from "@/features/storage/service";

function notFound(): Response {
  return new Response("Not found", { status: 404 });
}

function htmlPage(body: string, status: number): Response {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; path?: string[] }> }
) {
  const { slug, path } = await params;

  const project = await getProjectBySlug(slug);
  if (!project) {
    return notFound();
  }

  const access = await resolveAccess(project, request);
  if (access.kind === "not-found") {
    return notFound();
  }
  if (access.kind === "password-prompt") {
    return htmlPage(
      renderPasswordPromptPage({ redirectTo: request.nextUrl.pathname }),
      200
    );
  }
  if (access.kind === "access-denied") {
    return htmlPage(
      renderAccessDeniedPage({ canSignIn: access.canSignIn, redirectTo: request.nextUrl.pathname }),
      403
    );
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

  const contentType = getContentType(relativeAssetPath);

  try {
    if (contentType.startsWith("text/html")) {
      const buffer = await storage.read(assetStoragePath);
      const html = injectBaseTag(buffer.toString("utf-8"), project.slug, relativeAssetPath);
      return new Response(html, { status: 200, headers: { "Content-Type": contentType } });
    }

    const stream = await storage.download(assetStoragePath);
    return new Response(stream, { status: 200, headers: { "Content-Type": contentType } });
  } catch {
    return notFound();
  }
}

/**
 * Handles the password-prompt form submission. Matched by the same
 * catch-all route as GET (any sub-path posts here too), but only `slug`
 * and the form body matter — the visitor is sent back to whichever URL
 * they originally requested via the `redirectTo` field.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const project = await getProjectBySlug(slug);
  if (!project || project.visibility !== "PASSWORD" || !project.passwordHash) {
    return notFound();
  }

  const formData = await request.formData();
  const password = formData.get("password");
  const redirectToRaw = formData.get("redirectTo");
  const redirectTo =
    typeof redirectToRaw === "string" && redirectToRaw.startsWith(`/sites/${slug}`)
      ? redirectToRaw
      : `/sites/${slug}`;

  if (typeof password !== "string" || !(await verifyProjectPassword(password, project.passwordHash))) {
    return htmlPage(
      renderPasswordPromptPage({ redirectTo, error: "Incorrect password." }),
      401
    );
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url), 303);
  response.cookies.set(projectAccessCookieName(project.id), signProjectAccessToken(project.id, project.passwordHash), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/sites/${slug}`,
  });
  return response;
}
