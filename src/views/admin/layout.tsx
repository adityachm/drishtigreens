import type { Child } from 'hono/jsx';
import { DOCS } from '../../content/schema.ts';

export type Flash = { kind: 'ok' | 'error'; text: string } | undefined;

const NAV_EXTRA: [string, string][] = [
  ['/admin/media', 'Photos'],
  ['/admin/enquiries', 'Enquiries'],
  ['/admin/account', 'Password'],
];

function Head({ title, v }: { title: string; v: string }) {
  return (
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="noindex, nofollow" />
      <title>{title} · Drishti Greens admin</title>
      <link rel="icon" href={`/static/favicon.png?v=${v}`} type="image/png" />
      <link rel="stylesheet" href={`/static/admin.css?v=${v}`} />
      <script src={`/static/admin.js?v=${v}`} defer></script>
    </head>
  );
}

export function AdminLayout(props: { title: string; active: string; v: string; flash?: Flash; newEnquiries?: number; children: Child }) {
  const links: [string, string][] = [['/admin', 'Dashboard'], ...DOCS.map((d): [string, string] => [`/admin/edit/${d.key}`, d.title]), ...NAV_EXTRA];
  return (
    <html lang="en">
      <Head title={props.title} v={props.v} />
      <body class="admin">
        <header class="a-top">
          <a class="a-brand" href="/admin">Drishti Greens <span>Admin</span></a>
          <button class="a-menu" type="button" aria-expanded="false" aria-controls="a-nav">Menu</button>
          <div class="a-top-actions">
            <a href="/" target="_blank" rel="noopener">View website</a>
            <form method="post" action="/admin/logout">
              <button type="submit" class="a-link">Sign out</button>
            </form>
          </div>
        </header>
        <div class="a-shell">
          <nav class="a-nav" id="a-nav" aria-label="Admin">
            {links.map(([href, label]) => (
              <a href={href} class={props.active === href ? 'active' : undefined} aria-current={props.active === href ? 'page' : undefined}>
                {label}
                {href === '/admin/enquiries' && props.newEnquiries ? <span class="badge">{props.newEnquiries}</span> : null}
              </a>
            ))}
          </nav>
          <main class="a-main">
            {props.flash && (
              <div class={`flash flash-${props.flash.kind}`} role={props.flash.kind === 'error' ? 'alert' : 'status'}>
                {props.flash.text}
              </div>
            )}
            {props.children}
          </main>
        </div>
      </body>
    </html>
  );
}

export function LoginPage({ v, error, noPassword, turnstileKey }: { v: string; error?: string; noPassword: boolean; turnstileKey: string }) {
  return (
    <html lang="en">
      <Head title="Sign in" v={v} />
      <body class="admin login">
        <main class="login-card">
          <h1>Drishti Greens</h1>
          <p class="muted">Sign in to edit the website.</p>
          {noPassword && (
            <div class="flash flash-error" role="alert">
              No admin password has been set yet. Set one with <code>npm run set-password:remote</code>.
            </div>
          )}
          {error && (
            <div class="flash flash-error" role="alert">
              {error}
            </div>
          )}
          <form method="post" action="/admin/login" class="stack">
            <input type="text" name="username" value="admin" autocomplete="username" hidden />
            <label for="password">Password</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required autofocus />
            {turnstileKey && <div class="cf-turnstile" data-sitekey={turnstileKey}></div>}
            <button type="submit" class="a-btn a-btn-primary">Sign in</button>
          </form>
        </main>
        {turnstileKey && <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>}
      </body>
    </html>
  );
}
