#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${LABFLOW_CONFIG:?Absolute path to the Compose environment file}"
: "${BACKUP_DIR:?Directory on an independent backup destination}"
: "${BACKUP_MOUNT:?Mount point of independent backup storage}"
mountpoint -q "$BACKUP_MOUNT" || { echo "Backup destination is not mounted" >&2; exit 1; }
case "$(realpath -m "$BACKUP_DIR")" in
  "$(realpath "$BACKUP_MOUNT")"/*) ;;
  *) echo "BACKUP_DIR must be inside BACKUP_MOUNT" >&2; exit 1 ;;
esac
compose_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
name="labflow-$(date -u +%Y%m%dT%H%M%S)-${RANDOM}.sqlite"
mkdir -p "$BACKUP_DIR"
docker compose --env-file "$LABFLOW_CONFIG" -f "$compose_dir/compose.yaml" exec -T app node vps/storage.mjs backup /data/labflow.sqlite "/data/backups/$name"
docker compose --env-file "$LABFLOW_CONFIG" -f "$compose_dir/compose.yaml" cp "app:/data/backups/$name" "$BACKUP_DIR/$name"
docker compose --env-file "$LABFLOW_CONFIG" -f "$compose_dir/compose.yaml" cp "app:/data/backups/$name.json" "$BACKUP_DIR/$name.json"
node --input-type=module - "$BACKUP_DIR/$name" <<'JS'
import {createReadStream} from 'node:fs';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const path=process.argv[2],manifest=JSON.parse(await readFile(path+'.json','utf8')),hash=createHash('sha256');
for await(const chunk of createReadStream(path))hash.update(chunk);
if(manifest.sha256!==hash.digest('hex')||manifest.size!==(await stat(path)).size)throw Error('Copied backup verification failed');
console.log('Independent backup copy verified');
JS
# No automatic retention deletion. Keep source copies until recovery has been tested.
