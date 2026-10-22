-- Editable site content. One row per document (settings, home, about, services, projects, contact);
-- value is JSON. Missing rows fall back to the defaults in src/content/defaults.ts.
CREATE TABLE content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Uploaded images. Files live in R2 under media/<id>/: resized copies named <width>.<ext>
-- plus the untouched original.
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  alt TEXT NOT NULL DEFAULT '',
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  ext TEXT NOT NULL CHECK (ext IN ('webp', 'jpg')),
  widths TEXT NOT NULL,
  original_key TEXT,
  original_name TEXT,
  bytes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  project_type TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'handled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX enquiries_created_at ON enquiries (created_at DESC);

-- The single admin login. password_hash format: pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>
CREATE TABLE admin_user (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  password_hash TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Only a SHA-256 of each session token is stored, so a database leak does not leak live sessions.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Failed login tracking per IP, for lockouts.
CREATE TABLE login_attempts (
  ip TEXT PRIMARY KEY,
  failures INTEGER NOT NULL,
  window_start INTEGER NOT NULL,
  locked_until INTEGER NOT NULL DEFAULT 0
);
