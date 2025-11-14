## BMS · Copilot Agentic Needs

Portail d’entretien guidé permettant de:

- conduire un recueil normé des besoins Copilot M365 auprès des chefs de produits marketing BMS ;
- structurer les données en objet `StructuredNeed` (JSON) ;
- calculer une matrice Strategic Fit (Importance x Fréquence) ;
- pousser automatiquement le résultat vers un webhook n8n pour archivage (ex. Google Sheet).

L’agent “Helios” s’appuie sur OpenAI et orchestre plusieurs modèles : rapide pour la mise en contexte, plus intelligent pour l’exploration, et un modèle premium pour la normalisation finale.

## Agents disponibles

- **Helios v1 (chat guidé)** : parcours conversationnel classique, parfait pour des entretiens live rapides.
- **Helios v2 (chat aligné sur le questionnaire)** : mêmes étapes que le formulaire Google (rituels, signaux d’alerte, strategic fit requis). Sélection possible directement dans l’interface (toggle “Helios v1 / v2”).
- **Modo Realtime & audio** : page `/realtime`, streaming voix + texte.
- **Agent formulaire** : page `/questionnaire`, saisie de la trame complète en mode asynchrone.

## Démarrage local

```bash
npm install          # install dépendances
npm run dev          # http://localhost:3000
```

## Variables d’environnement

| clé | description |
| --- | ----------- |
| `OPENAI_API_KEY` | requis, clef OpenAI utilisée par l’agent |
| `OPENAI_MODEL` | modèle par défaut si aucun profil spécifique n’est fourni |
| `OPENAI_MODEL_FAST` | modèle rapide (intro/contexte), défaut `gpt-5-nano` |
| `OPENAI_MODEL_BALANCED` | modèle équilibré (exploration/pain points), défaut `gpt-5-mini` |
| `OPENAI_MODEL_PREMIUM` | modèle premium (normalisation finale), défaut `gpt-5.1` |
| `OPENAI_REALTIME_MODEL` | modèle pour WebRTC/audio (`gpt-realtime-mini` par défaut) |
| `N8N_WEBHOOK_URL` | optionnel, webhook cible (défaut : URL fournie par Maxim) |

## Déploiement

1. Construire le projet : `npm run build`.
2. Publier le dossier `.next` via votre pipeline (ex : Vercel, OVH, FTP vers `latry.consulting/projet/bms/agentic-needs/`).
3. Renseigner les variables d’environnement côté hébergement puis redémarrer le service.

## GitHub Actions → OVH

Le workflow `.github/workflows/deploy.yml` se déclenche sur `main` et:

1. installe les dépendances, lint, build (avec les secrets OpenAI) ;
2. exécute `npm prune --production` puis assemble un dossier `deploy` contenant `.next`, `public`, `node_modules`, `package*.json`, `next.config.ts`, `tsconfig.json` ;
3. pousse le contenu sur l’hébergement OVH via FTP (action `SamKirkland/FTP-Deploy-Action`).

Secrets requis côté repo GitHub:

| secret | usage |
| --- | --- |
| `OPENAI_API_KEY` (+ optionnel `OPENAI_MODEL*`) | build côté CI |
| `OVH_ADRESSE` | adresse FTP OVH (ex. `ftp.latry.consulting`) |
| `FTP_LOGIN` / `FTP_PASSWORD` | identifiants FTP |
| `FTP_TARGET_DIR` | répertoire distant, ex. `/www/projet/bms/agentic-needs/` |

Variable optionnelle côté repo GitHub : `vars.PROJECT_ROOT` (par défaut `.`) si le code vit dans un sous-dossier.

Une fois remplis, chaque push sur `main` reconstruit et synchronise le site automatiquement.

## Webhook & Google Sheet

L’API `/api/finalize` publie automatiquement le JSON sur `https://n8n-byhww-u43341.vm.elestio.app/webhook/b9b80ad2-991f-419b-bfaf-7d8faca3de72`.  
Vous pouvez remplacer cette valeur via `N8N_WEBHOOK_URL` pour pointer vers une autre automatisation (Google Sheets, SharePoint, etc.).

## Modalités Realtime / Audio

- L’API `/api/realtime-session` génère un token éphémère (client secret) pour ouvrir une session WebRTC côté navigateur.
- La page `/realtime` embarque un composant expérimental `RealtimeConsole` : connexion audio, logs, et envoi de texte via data channel.
- Exemples audio (`gpt-audio` / `gpt-audio-mini`) et roadmap sont détaillés dans cette page pour préparer les déclinaisons live.

## Agent formulaire

La page `/questionnaire` reprend la trame Google Forms : persona, moments critiques (nouvelle version de l’ancienne section “Workflow & volumes”), pain points, données, opportunités Copilot, automatisations et strategic fit. Soumission → conversion en `StructuredNeed` + envoi webhook, idéal pour des interviews asynchrones.

## Stack

- Next.js App Router + Tailwind
- OpenAI SDK
- n8n (collecte des résultats)
