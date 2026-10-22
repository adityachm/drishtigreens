# Drishti Greens website

The Drishti Greens site with a password-protected admin panel at `/admin`. All text and photos can be edited from the panel. It runs on Cloudflare Workers, with content in D1 and photos in R2.

```
Visitor ─► Worker (Hono, server-rendered pages) ─► D1: content, photos list, enquiries, admin login
                                                └► R2: photos (resized copies + originals)
Admin   ─► /admin (password login) ─► same Worker, writes D1/R2. Changes are live on save.
```

- **Content changes** (text, photos, services, projects) are made in `/admin` and go live immediately. No deploy is needed.
- **Code changes** go through GitHub. A push to `main` runs the checks, applies database migrations and deploys.

## Project layout

| Path | What it is |
| --- | --- |
| `src/index.tsx` | Public routes, the contact form, photo serving and security headers |
| `src/admin/routes.tsx` | Admin panel: sign-in, editors, photos, enquiries, password |
| `src/content/schema.ts` | The editable documents and their fields. **Add a field here to make it editable.** |
| `src/content/defaults.ts` | Starting content from the client brief, used until a document is saved |
| `src/views/site/*` | Public page templates |
| `src/views/admin/*` | Admin page templates; the editor form is generated from `schema.ts` |
| `public/static/` | CSS, JS and favicon |
| `migrations/` | D1 schema |
| `scripts/` | One-off scripts: set the admin password, load the starting photos |

### How editing works

Each page's content is one JSON document in the `content` table (`home`, `about`, `services`, `projects`, `contact`, `settings`). The admin editor is generated from the field list in `src/content/schema.ts`, and submissions are validated against that list. Saved values are merged over `defaults.ts`, so a field added in code shows its default until someone edits it.

Photos are resized **in the admin's browser** to 480, 960 and 1600 px WebP copies (JPEG where WebP isn't supported, e.g. older Safari). The browser uploads these together with the untouched original. Pages serve the copies with `srcset`, and every photo URL is cached for a year, which is safe because each upload gets a new ID.

### Admin security

- There is one password and no username. Only a salted PBKDF2-SHA256 hash is stored, in D1.
- Sessions use a random token in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie scoped to `/admin`. Only the token's SHA-256 is stored. Sessions last 7 days. Changing the password signs out every device.
- After 5 wrong passwords from one IP, sign-in is locked for 15 minutes.
- Every admin `POST` is rejected unless it comes from the site itself (CSRF protection).
- Optional: Cloudflare Turnstile on the login and contact forms (see below).
- There is no "forgot password" email. Reset the password with `npm run set-password:remote`.

## Local development

Requires Node 24+.

```sh
npm install
npm run db:migrate:local
npm run seed:local            # loads ../Drishti_Greens_Website_Photos_Named into local R2
npm run set-password:local    # choose a local admin password
npm run dev                   # http://localhost:8787  and  /admin
```

Checks: `npm run typecheck` and `npm test`.

## One-time Cloudflare setup

Run these from this folder, logged in with `npx wrangler login`.

1. **Create the database and the photo bucket**
   ```sh
   npx wrangler d1 create drishtigreens
   npx wrangler r2 bucket create drishtigreens-media
   ```
   Copy the `database_id` printed by the first command into `wrangler.jsonc`, replacing the zeros. Then commit it.

2. **Create the tables, load the photos and set the admin password**
   ```sh
   npm run db:migrate:remote
   npm run seed:remote
   npm run set-password:remote
   ```

3. **First deploy**: `npm run deploy`. The site is then live at `https://drishtigreens.<your-subdomain>.workers.dev`.

4. **Domain**: once `drishtigreens.com` is on this Cloudflare account, uncomment `routes` in `wrangler.jsonc` and deploy. Requests to `www.` are redirected to the bare domain.

5. **Turnstile (recommended, stops spam enquiries)**: create a widget for the domain in the Cloudflare dashboard. Put its site key in `vars.TURNSTILE_SITE_KEY` in `wrangler.jsonc`, then store the secret with `npx wrangler secret put TURNSTILE_SECRET`. Turnstile only switches on when both are set.

## CI/CD (GitHub Actions)

`.github/workflows/ci.yml`:

- **Every push and pull request** runs the typecheck, the tests and a build without deploying.
- **A push to `main`** also applies new D1 migrations and then deploys. Work on `develop` and merge into `main` to release.

Repository secrets to add (Settings → Secrets and variables → Actions):

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | From `npx wrangler whoami` |
| `CLOUDFLARE_API_TOKEN` | An API token made from the **Edit Cloudflare Workers** template, with **Account → D1 → Edit** added |

The `deploy` job runs in a GitHub environment named `production`. You can add required reviewers to that environment if you want to approve each release.

### Database changes

Add a new numbered file in `migrations/` (never edit one that has been applied). CI applies it before deploying the code that needs it. Locally, run `npm run db:migrate:local`.

## Before launch

- Add the real phone, WhatsApp, email and address in **Admin → Site settings**. Empty fields are hidden on the site.
- Upload the logo in **Site settings → Logo**, or keep the built-in mark.
- Three services from the "About Us" document are included but **hidden**: stone and pebble landscaping, rock gardens, and wellness gardens. Switch them on in **Admin → Services** once they have photos.
