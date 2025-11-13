# BMS – Agentic Needs Interview (M365 Copilot)

Petit site d’entretien guidé avec un agent (OpenAI) pour collecter des besoins de création d’agents M365 Copilot, produire un résumé normé, l’envoyer par email et pousser un payload structuré vers un webhook n8n.

## Structure

```
agentic-needs/
  index.html
  style.css
  app.js
  api.php
  config.php.example
  utils.php
  deploy-ftp.sh
```

## Configuration

1) Copiez `config.php.example` en `config.php`, puis renseignez:
- `OPENAI_API_KEY`
- `N8N_WEBHOOK_URL` (déjà pointé vers votre URL)
- `NOTIFY_EMAIL` (par défaut: maximelat@gmail.com)

2) Optionnel: utilisez des variables d’environnement serveur si vous préférez:
- `OPENAI_API_KEY`
- `N8N_WEBHOOK_URL`
- `NOTIFY_EMAIL`

## Lancement en local

- Un serveur PHP suffit:
```bash
php -S 127.0.0.1:8080 -t .
```
Ouvrir `http://127.0.0.1:8080/agentic-needs/`.

## Déploiement (OVH via FTP)

Remplissez vos variables d’environnement:
```
export FTP_LOGIN="..."
export FTP_PASSWORD="..."
export OVH_ADRESSE="ftp.votre-domaine.tld"
export REMOTE_DIR="/latry.consulting/projet/bms/agentic-needs"
```
Puis:
```bash
bash deploy-ftp.sh
```

## GitHub

Le repo cible: `https://github.com/maximelat/bms-agent-for-marketing/`

## Sécurité

- La clé OpenAI n’est jamais exposée côté client.
- Le backend force un format JSON strict pour normaliser les résultats.


