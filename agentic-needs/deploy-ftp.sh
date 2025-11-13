#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${FTP_LOGIN:-}" || -z "${FTP_PASSWORD:-}" || -z "${OVH_ADRESSE:-}" ]]; then
  echo "Erreur: FTP_LOGIN / FTP_PASSWORD / OVH_ADRESSE doivent être définis."
  exit 1
fi

REMOTE_DIR="${REMOTE_DIR:-/latry.consulting/projet/bms/agentic-needs}"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Déploiement FTP → $OVH_ADRESSE:$REMOTE_DIR"
echo "Depuis: $LOCAL_DIR"

lftp -u "$FTP_LOGIN","$FTP_PASSWORD" "$OVH_ADRESSE" <<EOF
set ssl:verify-certificate no
set net:max-retries 2
set net:timeout 20
mkdir -p $REMOTE_DIR
cd $REMOTE_DIR
mirror -R --delete --verbose $LOCAL_DIR .
bye
EOF

echo "Déploiement terminé."


