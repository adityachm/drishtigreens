# Drishti Greens website

The Drishti Greens site with a password-protected admin panel at `/admin`. All text and photos can be edited from the panel. It runs as one small Node.js container on the home server (192.168.1.40). Content is stored in SQLite and photos on disk, and the site is reached through the Cloudflare tunnel on .42.

```
Visitor ─► Cloudflare ─► tunnel "ganga" (.42) ─► .40:8790  Node + Hono ─► ~/drishtigreens-data/
                                                                          ├─ drishtigreens.sqlite (content, photo list, enquiries, admin login)
Admin ─► /admin (password) ─► same app. Changes are live on save.         └─ media/ (photos: resized copies + originals)
```

- **Content changes** (text, photos, services, projects) are made in `/admin` and go live immediately.
- **Code changes**: push a **signed** commit to `main` and the server deploys it within seconds. Commits that aren't signed by a trusted key are refused. See [Deploys](#deploys).

## Project layout

| Path | What it is |
| --- | --- |
| `src/index.tsx` | The page (`/`), the contact form, photo serving, redirects from old page addresses, security headers |
| `src/admin/routes.tsx` | Admin panel: sign-in, editors, photos, enquiries, password |
| `src/content/schema.ts` | The editable documents and their fields. **Add a field here to make it editable.** |
| `src/content/defaults.ts` | Starting content from the client brief, used until a document is saved |
| `src/views/site/*`, `src/views/admin/*` | Templates: the one-page site and the admin panel; the admin editor form is generated from `schema.ts` |
| `src/platform/` | SQLite (`node:sqlite`), photo storage on disk, settings |
| `src/server.ts` | Node entry point; `src/manage.ts`: migrate / set-password / backup |
| `public/static/` | CSS, JS and favicon |
| `migrations/` | Database schema, applied in order and recorded in the `migrations` table |
| `deploy/` | Docker image and the home-server scripts |
| `scripts/` | Local dev server; loading the starting photos |

### How editing works

The website is a single page; the menu scrolls to its sections (Home, About, Services, Projects, Approach, Contact). Each section's content is one JSON document in the `content` table (`home`, `about`, `services`, `projects`, `approach`, `contact`, plus `settings` for details used everywhere), with its own screen in the admin panel. The editor is generated from the field list in `src/content/schema.ts`, and submissions are validated against that list. Saved values are merged over `defaults.ts`, so a field added in code shows its default until someone edits it.

Photos are resized **in the admin's browser** to 480, 960 and 1600 px WebP copies (JPEG where WebP isn't supported, e.g. older Safari), so the server never has to process images. Every photo URL is cached for a year, which is safe because each upload gets a new ID. Cloudflare's edge serves most photo and CSS requests, so they rarely reach the home server.

### Admin security

- There is one password and no username. Only a salted PBKDF2-SHA256 hash is stored.
- Sessions use a random token in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie scoped to `/admin`. Only the token's SHA-256 is stored. Sessions last 7 days. Changing the password signs out every device.
- After 5 wrong passwords from one IP, sign-in is locked for 15 minutes.
- Every admin `POST` is rejected unless it comes from the site itself (CSRF protection).
- The tunnel speaks plain HTTP to the server. The app trusts `X-Forwarded-Proto: https` from it, so secure cookies and the same-origin checks still work.
- There is no "forgot password" email. Reset the password on the server with `~/drishtigreens/deploy/set-password.sh`.

## Local development

Requires Node 24+.

```sh
npm install
npm run seed            # database + the 15 photos from ../Drishti_Greens_Website_Photos_Named into ./data
npm run set-password    # choose a local admin password
npm run dev             # http://localhost:8787  and  /admin  (rebuilds and restarts on save)
```

Checks: `npm run typecheck`, `npm test` and `npm run build`. GitHub Actions runs the same on every push and pull request.

## Deploys

The server checks GitHub every 5 seconds (`deploy/autodeploy.sh`, started by cron). When `main` has a new commit it:

1. fetches the commit **without checking it out**;
2. **verifies its signature** against `~/drishtigreens-secrets/allowed_signers`. That file lives only on the server, so nothing pushed to the repo can change who is trusted. A commit that is unsigned or signed by any other key is refused and logged, and the site keeps running the previous version;
3. checks the commit out and runs `deploy/deploy.sh`: build the image, back up, migrate, restart, health check. If the new version isn't healthy, it rolls back automatically.

The signature covers the whole tree of files, so a verified commit at the tip of `main` means every deployed file is exactly what the key holder signed.

Log: `~/drishtigreens-deploy.log` on the server.

### Signing commits

This checkout is set up to sign every commit with `~/.ssh/id_rsa` (repo-local git config):

```sh
git config gpg.format ssh
git config user.signingkey ~/.ssh/id_rsa
git config commit.gpgsign true
```

To trust another person or machine, add its **public** key on the server:

```sh
echo 'name namespaces="git" ssh-ed25519 AAAA…' >> ~/drishtigreens-secrets/allowed_signers
```

Merging a pull request with GitHub's button creates a commit signed by GitHub, not by you, so the server won't deploy it. Merge locally (`git merge --ff-only` or a signed merge commit) and push.

### Server layout (192.168.1.40, user aditya)

| Path | What it is |
| --- | --- |
| `~/drishtigreens/` | This repository on `main`. Only ever moved to a verified commit |
| `~/drishtigreens-data/` | `drishtigreens.sqlite` and `media/`. Deploys never touch it |
| `~/drishtigreens-backups/` | Database copies (14 days) and a copy of every photo |
| `~/drishtigreens-secrets/` | `allowed_signers` (who may deploy) and `.env` (email and Turnstile settings) |

Crontab:

```
* * * * * /home/aditya/drishtigreens/deploy/autodeploy.sh
0 22 * * * /home/aditya/drishtigreens/deploy/backup.sh >> /home/aditya/drishtigreens-deploy.log 2>&1
```

Useful commands on the server: `deploy/set-password.sh`, `deploy/set-email.sh`, `deploy/restart.sh` (after editing `.env`), `deploy/backup.sh`, `docker logs drishtigreens`.

### Domain

`drishtigreens.com` must be on Cloudflare (free plan). Add the site in Cloudflare, switch the nameservers at GoDaddy, then in **Zero Trust → Networks → Tunnels → ganga → Public hostnames** add:

- `drishtigreens.com` → `HTTP` → `192.168.1.40:8790`
- `www.drishtigreens.com` → `HTTP` → `192.168.1.40:8790` (the app redirects `www` to the bare domain)

### Email alerts for new enquiries

Each enquiry is saved first and then emailed in the background, so a mail problem never loses one. The email goes to the addresses in **Admin → Site settings → Enquiry alerts**, or to the business email if that list is empty. Its Reply-To is the person who sent the enquiry, so replying answers them. If an email fails, the enquiry is tagged "Email alert failed" in the inbox. More than 20 enquiries in an hour stops the emails (the enquiries are still saved), so a spam run can't flood the mailbox.

Alerts are sent from `harsha@drishtigreens.com` (Google Workspace) through Google's mail servers. The domain's SPF and DKIM records already allow Google to send for it, which matters because the domain's DMARC policy quarantines anything else.

To set or change the sending account, create an [app password](https://myaccount.google.com/apppasswords) while signed in as that account (it needs 2-Step Verification). Then run this on the server, which asks for the password without showing it, restarts the site and sends a test email:

```sh
/home/aditya/drishtigreens/deploy/set-email.sh
```

It writes these settings to `~/drishtigreens-secrets/.env` (any SMTP account works if you edit them by hand and run `deploy/restart.sh`):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=harsha@drishtigreens.com
SMTP_PASS=the 16-letter app password
# Optional: SMTP_FROM (defaults to SMTP_USER), SMTP_FROM_NAME (defaults to "Drishti Greens Website"),
# SMTP_SECURITY=tls (port 465, the default) or starttls (port 587)
```

Then use **Send a test email** on the admin dashboard. The dashboard also shows whether alerts are on and where they go.

### Turnstile (recommended, stops spam enquiries)

Create a Turnstile widget for the domain in Cloudflare, then on the server put both keys in `~/drishtigreens-secrets/.env` and run `deploy/restart.sh`:

```
TURNSTILE_SITE_KEY=0x…
TURNSTILE_SECRET=0x…
```

## Before launch

- Add the real phone, WhatsApp, email and address in **Admin → Site settings**. Empty fields are hidden on the site.
- Upload the logo in **Site settings → Logo**, or keep the built-in mark.
- Three services from the "About Us" document are included but **hidden**: stone and pebble landscaping, rock gardens, and wellness gardens. Switch them on in **Admin → Services** once they have photos.
