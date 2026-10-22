#!/usr/bin/env bash
# Backup: a consistent copy of the database (safe while the site runs; 14 days kept) and a copy of
# every photo in ~/drishtigreens-backups/media (photos are never deleted from the backup).
# Also copies both to another machine when BACKUP_COPY_TO is set, e.g.
#   BACKUP_COPY_TO=aditya@192.168.1.42:drishtigreens-backups/ BACKUP_COPY_PORT=7336
# Restore: stop the site, copy a backup over ~/drishtigreens-data/drishtigreens.sqlite
# (and media/ if needed), start it.
source "$(dirname "$0")/common.sh"
[ -f "$DB_FILE" ] || { echo "No database yet — nothing to back up."; exit 0; }
manage backup --dir /backups --keep-days 14
rsync -a "$DATA_DIR/media/" "$BACKUP_DIR/media/"
if [ -n "${BACKUP_COPY_TO:-}" ]; then
  rsync -a -e "ssh -o BatchMode=yes -p ${BACKUP_COPY_PORT:-22}" "$BACKUP_DIR/" "$BACKUP_COPY_TO" \
    && echo "Copied to $BACKUP_COPY_TO" || echo "WARNING: copy to $BACKUP_COPY_TO failed (the local backup is fine)"
fi
