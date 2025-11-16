# Récapitulatif Système Complet Helios

## 🎯 Architecture finale

### Frontend (Next.js + Netlify)
- **Chat conversationnel** : routé via n8n (`/api/chat-webhook`)
- **Normalisation canevas** : agent n8n (`/api/canvas-normalize`)
- **Galerie & votes** : Google Sheets via n8n
- **Dictée vocale** : `gpt-4o-transcribe` (Whisper)
- **Modes** : Helios chat, Formulaire, Realtime audio

### Backend n8n

**1. Chat** (`/webhook/d10cfbf3-1516-4c7e-9150-d326f383de10`)
- Model : `gpt-4o-mini`
- Mémoire : Buffer Window (sessionId)
- Output : `{ reply, phase, status, normalizedUpdate, responseId }`

**2. Normalisation** (`/webhook/canvas-normalize`)
- Model : `gpt-4o-mini` ou `gpt-5.1`
- Input : `{ transcriptText, structuredNeed, canvasId }`
- Output : `{ normalizedCanvas: { Persona, painpoint, opportunitécopilot, problemToSolve, ..., strategicFit } }`

**3. Ajout galerie** (`/webhook/add-to-gallery`)
- Stocke dans Google Sheets : toutes les colonnes du canevas
- Colonnes : `Agent-Name`, `Agent-Description`, `Persona`, `painpoint`, `opportunitécopilot`, `problemToSolve`, `useCaseDescription`, `dataAndProductUsed`, `businessObjective`, `keyResults`, `stakeholders`, `strategicFit.importance`, `strategicFit.frequency`, `strategicFit.rationale`, `votes`, `voters`, `id`, `createdAt`, `submittedBy`

**4. Get galerie** (`/webhook/5abf522a-fd25-4168-a020-f50f10024ffd`)
- Lit Google Sheets (toutes les lignes)
- Renvoie array ou objet unique si 1 ligne

**5. Vote** (`/webhook/vote`)
- Cherche ligne avec `canvasId`
- Incrémente `votes`
- Ajoute `voterEmail` à `voters` (JSON array)

**6. Template agent** (`/webhook/5abf522a-fd25-4168-a020-f50f10024ffd` avec param `id`)
- Cherche ligne avec `id=canvasId`
- Renvoie le canevas complet

### Variables Netlify

```
N8N_WEBHOOK_URL=https://n8n.../webhook/b9b80ad2...  (finalize email)
N8N_WEBHOOK_CANVAS_NORMALIZE=https://n8n.../webhook/canvas-normalize
N8N_WEBHOOK_ADD_GALLERY=https://n8n.../webhook/add-to-gallery
N8N_WEBHOOK_GET_GALLERY=https://n8n.../webhook/5abf522a...
N8N_WEBHOOK_VOTE=https://n8n.../webhook/vote
```

### Domaine

`https://agentic.latry.consulting` (CNAME vers Netlify via Cloudflare)

## 📊 Colonnes Google Sheets "Galerie"

| Agent-Name | Agent-Description | Persona | painpoint | opportunitécopilot | problemToSolve | useCaseDescription | dataAndProductUsed | businessObjective | keyResults | stakeholders | strategicFit.importance | strategicFit.frequency | strategicFit.rationale | votes | voters | id | createdAt | submittedBy |
|------------|-------------------|---------|-----------|--------------------|--------------|--------------------|-------------------|------------------|-----------|-------------|------------------------|----------------------|----------------------|-------|--------|----|-----------| ------------|

Arrays stockés en JSON stringifié : `["item1","item2"]`

## 🔄 Flow utilisateur complet

1. **Conversation** (3+ échanges) → n8n chat avec mémoire
2. **Clic "🤖 Compléter le canevas"** → normalisation n8n → Canevas + Synthèse remplis
3. **(Optionnel) "✏️ Éditer"** → ajuster manuellement
4. **Clic "➕ Ajouter à la galerie"** (si complet) → stocké dans Google Sheets
5. **Clic "Envoyer le compte-rendu"** (si complet + email) → email + archive
6. **/gallery** → voir tous les canevas, voter, télécharger template

## 🚀 Prochaines étapes

- [ ] Implémenter accordéon galerie
- [ ] Bouton "Template agent" (génère document formaté)
- [ ] Système de vote fonctionnel (POST `/api/gallery`)
- [ ] Édition canevas côté galerie

