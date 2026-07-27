function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PAGE_STYLE = `
  body { font-family: system-ui, -apple-system, sans-serif; background: #f6f7f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; max-width: 360px; width: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.06); box-sizing: border-box; }
  h1 { font-size: 18px; margin: 0 0 8px; color: #111827; }
  p { color: #6b7280; font-size: 14px; margin: 0 0 20px; line-height: 1.5; }
  input[type="password"] { width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; margin-bottom: 12px; }
  button, a.button { display: inline-block; text-align: center; width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; border: none; background: #111827; color: #fff; font-size: 14px; cursor: pointer; text-decoration: none; }
  .error { color: #b91c1c; font-size: 13px; margin: 0 0 12px; }
`;

export function renderPasswordPromptPage({
  redirectTo,
  error,
}: {
  redirectTo: string;
  error?: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Password required</title>
<style>${PAGE_STYLE}</style>
</head>
<body>
  <div class="card">
    <h1>Password required</h1>
    <p>This site is password protected.</p>
    ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
    <form method="POST">
      <input type="hidden" name="redirectTo" value="${escapeHtml(redirectTo)}">
      <input type="password" name="password" placeholder="Enter password" autofocus required>
      <button type="submit">Continue</button>
    </form>
  </div>
</body>
</html>`;
}

export function renderAccessDeniedPage({
  canSignIn,
  redirectTo,
}: {
  canSignIn: boolean;
  redirectTo: string;
}): string {
  const signInHref = `/login?redirect=${encodeURIComponent(redirectTo)}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Access denied</title>
<style>${PAGE_STYLE}</style>
</head>
<body>
  <div class="card">
    <h1>Access denied</h1>
    <p>${
      canSignIn
        ? "This site is restricted to specific people. Sign in with the email address the owner allowlisted."
        : "This site is restricted, and your account isn't on the allowlist. Contact the owner if you think this is a mistake."
    }</p>
    ${canSignIn ? `<a class="button" href="${escapeHtml(signInHref)}">Sign in</a>` : ""}
  </div>
</body>
</html>`;
}
