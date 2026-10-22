#!/usr/bin/env bash
# Set the account that sends enquiry alerts (Google Workspace or Gmail), then restart the site
# and send a test email. Asks for the app password without showing it:
#   /home/aditya/drishtigreens/deploy/set-email.sh
# Create the app password at https://myaccount.google.com/apppasswords while signed in as that
# account (it needs 2-Step Verification turned on).
source "$(dirname "$0")/common.sh"
ENV_FILE="$SECRETS_DIR/.env"

read -rp "Send from which Google account? [harsha@drishtigreens.com]: " user
user="${user:-harsha@drishtigreens.com}"
read -rsp "App password for $user (typing is hidden): " pass
echo
pass="${pass// /}"   # Google shows it as four groups of four letters
if [ -z "$pass" ]; then echo "No password entered — nothing changed."; exit 1; fi
[ "${#pass}" -eq 16 ] || echo "Note: Google app passwords are 16 letters; this one is ${#pass}. Continuing anyway."

# Replace any earlier SMTP_* lines and keep everything else (e.g. Turnstile keys).
tmp="$(mktemp "$SECRETS_DIR/.env.XXXXXX")"
grep -v '^SMTP_' "$ENV_FILE" > "$tmp" || true
{
  echo "SMTP_HOST=smtp.gmail.com"
  echo "SMTP_PORT=465"
  echo "SMTP_USER=$user"
  echo "SMTP_PASS=$pass"
} >> "$tmp"
chmod 600 "$tmp"
mv "$tmp" "$ENV_FILE"
echo "Saved to $ENV_FILE."

"$DEPLOY_DIR/restart.sh"
manage test-email
