/** Static bilingual HTML for edge/proxy 404 responses (no React runtime). */
export function renderBrandedNotFoundHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="robots" content="noindex, follow"/>
  <title>Page not found | QuestionWale</title>
  <style>
    body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F8FAFC;color:#0f172a;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:1rem}
    .wrap{max-width:36rem;text-align:center}
    .brand{font-size:.75rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#7C3AED}
    h1{margin:.75rem 0 0;font-size:2.25rem;line-height:1.15}
    p{margin:1rem 0 0;color:#475569;line-height:1.6}
    .actions{margin-top:2rem;display:flex;flex-wrap:wrap;gap:.75rem;justify-content:center}
    a,button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:.75rem 1.25rem;border-radius:9999px;font-size:.875rem;font-weight:600;text-decoration:none;cursor:pointer}
    .primary{background:#7C3AED;color:#fff;border:none}
    .secondary{border:1px solid #e2e8f0;background:#fff;color:#334155}
    .ghost{background:transparent;border:none;color:#475569}
  </style>
</head>
<body>
  <div class="wrap">
    <p class="brand">QuestionWale</p>
    <h1>Page not found</h1>
    <p>The page you requested is not available. Return home or browse subjects to continue practicing.</p>
    <div class="actions">
      <a class="primary" href="/">Go Home</a>
      <a class="secondary" href="/subjects">Browse Subjects</a>
      <button type="button" class="ghost" onclick="history.back()">Go back</button>
    </div>
  </div>
</body>
</html>`;
}
