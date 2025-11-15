# Spécification Agent Normalisation n8n

## Payload reçu du webhook

Lorsque l'utilisateur clique sur "Envoyer le compte-rendu", n8n reçoit :

```json
{
  "type": "bms-agentic-need",
  "capturedAt": "2025-11-14T20:15:30.123Z",
  
  "structuredNeed": { /* objet StructuredNeed complet */ },
  "useCaseCanvas": { /* objet UseCaseCanvas pré-rempli */ },
  
  "transcript": [
    { "role": "assistant", "content": "Bonjour..." },
    { "role": "user", "content": "..." }
  ],
  "transcriptText": "Helios: Bonjour...\n\nUtilisateur: ...",
  
  "recipientEmail": "prenom.nom@bms.com",
  "interviewDuration": "8 échanges",
  "needsNormalization": true,
  "canvasId": "abc-123-def"
}
```

## Champs à renvoyer vers Helios (optionnel, si vous voulez update en temps réel)

Si vous implémentez un endpoint de callback, renvoyez :

```json
{
  "canvasId": "abc-123-def",
  "normalizedCanvas": {
    "problemToSolve": "texte normalisé par l'agent",
    "useCaseDescription": "...",
    "dataAndProductUsed": ["source1", "source2"],
    "businessObjective": "...",
    "keyResults": ["KPI1", "KPI2"],
    "stakeholders": ["role1", "role2"],
    "strategicFit": {
      "importance": "high",
      "frequency": "medium",
      "rationale": "..."
    }
  },
  "status": "completed"
}
```

Helios pourrait alors fetch cet endpoint pour récupérer le canevas normalisé.

## System Prompt pour l'agent n8n (OpenAI)

```
Tu es un agent de normalisation de use cases Copilot M365 pour Bristol Myers Squibb.

MISSION : transformer une transcription d'entretien en canevas use case structuré.

INPUT : tu reçois :
- transcriptText : conversation complète Helios ↔ Utilisateur
- useCaseCanvas : canevas pré-rempli (peut contenir des champs incomplets)

OUTPUT : JSON strict avec ces champs EXACTEMENT :
{
  "problemToSolve": "phrase synthétique du problème métier (max 200 car)",
  "useCaseDescription": "description du use case agent Copilot (max 300 car)",
  "dataAndProductUsed": ["Source1 (SharePoint)", "Source2 (Teams)", "Outil M365"],
  "businessObjective": "objectif métier chiffré (max 150 car)",
  "keyResults": ["KPI1 mesurable", "KPI2 mesurable"],
  "stakeholders": ["Rôle1", "Rôle2", "Propriétaire"],
  "strategicFit": {
    "importance": "low" | "medium" | "high",
    "frequency": "low" | "medium" | "high",
    "rationale": "justification importance x fréquence (max 200 car)"
  }
}

RÈGLES STRICTES :
1. Toutes les strings sur UNE seule ligne (pas de \n dans les valeurs)
2. Pas de guillemets non échappés
3. Maximum 300 caractères par string
4. Extrais les infos de la transcription pour compléter les champs vides du canevas pré-rempli
5. Pour problemToSolve : synthétise les pain points évoqués
6. Pour useCaseDescription : décris l'agent déclaratif imaginé (basé sur docs, comportement attendu)
7. Pour dataAndProductUsed : liste les sources SharePoint/Teams mentionnées + outils M365
8. Pour businessObjective : objectif métier avec chiffre si possible
9. Pour keyResults : métriques de succès concrètes (temps gagné, qualité, volume)
10. Pour stakeholders : rôles impliqués (utilisateur + propriétaires de données)
11. Pour strategicFit : évalue importance (impact métier) et fréquence (combien de fois utilisé)

EXEMPLE :
Si l'utilisateur a dit "je passe 2h/semaine à résumer des meetings, j'aimerais un agent qui lit les transcripts Teams et génère un résumé normé BMS", produis :
{
  "problemToSolve": "Processus manuel de résumé de meetings chronophage (2h/semaine)",
  "useCaseDescription": "Agent déclaratif qui lit les transcripts Teams et génère des résumés normés format BMS",
  "dataAndProductUsed": ["Transcripts Teams", "Templates résumé BMS (SharePoint)"],
  "businessObjective": "Réduire le temps de résumé de 2h à 15min par semaine",
  "keyResults": ["Gain temps : 1h45/semaine", "Qualité résumés : format standard respecté"],
  "stakeholders": ["Chef produit marketing", "Equipe communication"],
  "strategicFit": {
    "importance": "medium",
    "frequency": "high",
    "rationale": "Impact modéré mais usage hebdomadaire systématique"
  }
}
```

## Workflow n8n recommandé

1. **Webhook receive** : récupère le payload
2. **Condition** : si `needsNormalization === true`
3. **OpenAI node** :
   - Model : `gpt-4o` ou `gpt-4o-mini`
   - System : prompt ci-dessus
   - User : `Transcription:\n${transcriptText}\n\nCanevas pré-rempli:\n${JSON.stringify(useCaseCanvas)}\n\nNormalise ce use case.`
   - Response format : JSON object
4. **Parse JSON** : extraire le canevas normalisé
5. **Store** :
   - Google Sheet (ligne avec tous les champs + canvasId)
   - ou Base de données
6. **(Optionnel) Callback** : POST vers une route Helios avec le canevas normalisé

## Champs attendus en retour (si callback)

Si vous implémentez un endpoint `/api/canvas-update` côté Helios, envoyez :

```json
POST https://agentic.latry.consulting/api/canvas-update
{
  "canvasId": "abc-123",
  "normalizedCanvas": { /* objet complet */ },
  "status": "completed",
  "timestamp": "2025-11-14T20:20:00Z"
}
```

Helios pourra alors mettre à jour l'affichage en temps réel.

## Pour la galerie de vote

Stockez dans Google Sheets / DB avec colonnes :
- `canvasId` (UUID)
- `submittedBy` (email)
- `createdAt` (timestamp)
- `problemToSolve`, `useCaseDescription`, `businessObjective`, etc.
- `votes` (nombre)
- `voters` (array d'emails)
- `status` ("pending", "approved", "implemented")

La page `/gallery` pourra ensuite fetch ces données et afficher les canevas triés par votes.

Tu veux que je crée aussi la route `/api/canvas-update` et l'interface `/gallery` interactive ?

