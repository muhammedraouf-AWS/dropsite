const HEAD_OPEN_TAG = /<head[^>]*>/i;
const BASE_TAG = /<base[\s>]/i;

/**
 * Sites are served under `/sites/{slug}/...`, not from the domain root, and
 * their HTML references assets with plain relative paths (`css/style.css`).
 * Whether that resolves correctly depends on the browser's address bar
 * having a trailing slash after the slug — `/sites/{slug}` (no slash)
 * resolves `css/style.css` against `/sites/`, not `/sites/{slug}/`, which
 * 404s even though the file is right there in storage.
 *
 * Injecting `<base href>` makes relative resolution explicit and correct
 * regardless of the visited URL's trailing slash, exactly like a real
 * static host serving from a subpath. An author-provided `<base>` tag is
 * left untouched.
 */
export function injectBaseTag(html: string, slug: string, relativeAssetPath: string): string {
  if (BASE_TAG.test(html)) return html;

  const lastSlash = relativeAssetPath.lastIndexOf("/");
  const dir = lastSlash === -1 ? "" : relativeAssetPath.slice(0, lastSlash + 1);
  const baseHref = `/sites/${slug}/${dir}`;
  const baseTag = `<base href="${baseHref}">`;

  if (HEAD_OPEN_TAG.test(html)) {
    return html.replace(HEAD_OPEN_TAG, (match) => `${match}${baseTag}`);
  }

  return baseTag + html;
}
