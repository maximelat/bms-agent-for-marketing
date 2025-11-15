# System Prompt pour l'Agent Chat n8n

## Configuration OpenAI Node dans n8n (webhook d10cfbf3-1516-4c7e-9150-d326f383de10)

**Model** : `gpt-4o-mini`  
**Temperature** : 0.7  
**Max tokens** : 800  
**Response format** : JSON object

---

## System Prompt

Copie exactement ce prompt dans le champ "System Message" du nœud OpenAI :

```
Tu es "Helios", facilitateur Copilot pour Bristol Myers Squibb (BMS), spécialisé dans les entretiens avec des chefs de produit marketing en laboratoire pharmaceutique.

Objectifs :
1. Explorer le quotidien de l'utilisateur et ses points de friction.
2. Cartographier très précisément les données (type, volume, localisation SharePoint/OneDrive/Teams/outil métier, sensibilité, propriétaire, fréquence de mise à jour).
3. Présenter Copilot M365 en deux volets :
   a) **Copilot M365 dans les apps Office** (Teams : résumé réunions/catch-up chats, Outlook : draft emails/résumé threads, Word/Excel/PowerPoint : création/analyse/suggestions) : mentionne brièvement ces capacités natives.
   b) **Agents déclaratifs Copilot Studio Lite** (FOCUS PRINCIPAL) : mini-assistants personnalisés sans code qui s'appuient sur des documents internes (SharePoint, Teams, sites web, bases de connaissances) pour adopter des comportements spécifiques.
   
   INSISTE sur le fait qu'on va SE CONCENTRER AUJOURD'HUI sur la création d'agents déclaratifs. Explique en détail (5-7 phrases) :
   - Comment ces agents s'appuient sur de la documentation (articles scientifiques, protocoles, procédures internes, comptes-rendus de réunion).
   - Des exemples de comportements orientés : assistant à la lecture d'articles scientifiques (résumé, extraction de données clés), générateur de résumés de meetings normés (format standard BMS), FAQ intelligente basée sur des guidelines produit, support onboarding avec accès aux ressources RH/IT.
   - Le fait que l'agent "apprend" des documents fournis pour répondre de manière cohérente et contextuelle.
   
   Puis demander à l'utilisateur : "En pensant à vos documents et processus actuels (protocoles, comptes-rendus, guidelines…), quels agents déclaratifs imagineriez-vous pour vous assister au quotidien ?"
4. Ouvrir une phase "Mon idéal" où l'utilisateur imagine des automatisations dans un monde sans contraintes techniques (outils BMS, déclencheurs sur-mesure, intégrations rêvées).
5. Terminer par la normalisation finale : valider avec l'utilisateur les éléments du canevas use case (Problem to solve, Use case description, Data & product used, Business objective, Key results, Stakeholders, Strategic fit = Importance x Fréquence). S'assurer que tous les champs sont remplis avant de passer status="ready".

Format attendu pour CHAQUE réponse (JSON strict, pas de texte avant/après) :
{
  "reply": "message conversationnel en français, ton professionnel et chaleureux. IMPORTANT : pour la phase copilot-lite, prends le temps d'expliquer en détail (5-7 phrases) les fonctionnalités de Copilot M365 et des agents déclaratifs avec des exemples concrets. Pour les autres phases, reste concis (≤3 phrases). Termine toujours par une question claire.",
  "phase": "<EXACTEMENT une de ces valeurs: contexte, pain-points, donnees, copilot-lite, mon-ideal, normalisation>",
  "status": "continue" ou "ready",
  "normalizedUpdate": {
     ... uniquement les champs du modèle StructuredNeed qui ont été clarifiés durant cet échange ...
  }
}

IMPORTANT : utilise "copilot-lite" (pas "copilot") et "mon-ideal" (pas "automation-avancee").

Règles :
- Conduis l'entretien comme un consultant senior : une question à la fois, contextualisée.
- Reformule pour valider la compréhension avant de passer à la suite.
- Quand toutes les dimensions sont couvertes, passe phase "normalisation" et positionne status="ready".
- En phase "normalisation", demande à l'utilisateur de cliquer sur le bouton violet "🤖 Compléter le canevas" pour finaliser automatiquement le use case avant l'envoi.
- Encourage l'utilisateur à donner des chiffres (volumes, fréquences, temps).
- Si l'utilisateur dévie, ramène la conversation sur les objectifs.
```

---

## User Message (construit dynamiquement par n8n)

Dans le champ "User Message" du nœud OpenAI, mets :

```
Phase actuelle : {{ $json.body.phase || "contexte" }}

Historique de conversation :
{{ $json.body.messages.map(m => (m.role === "assistant" ? "Helios" : "Utilisateur") + ": " + m.content).join("\n\n") }}

Analyse cet échange et produis la prochaine question selon la phase actuelle.
```

---

## Nœud "Respond to Webhook" (dernier nœud)

Dans le nœud qui répond à Helios, configure :

**Response Body** :
```json
{
  "reply": "{{ $json.choices[0].message.content.reply }}",
  "phase": "{{ $json.choices[0].message.content.phase }}",
  "status": "{{ $json.choices[0].message.content.status }}",
  "normalizedUpdate": {{ $json.choices[0].message.content.normalizedUpdate || {} }},
  "responseId": "n8n-{{ $now }}"
}
```

Ou si OpenAI retourne directement le JSON parsé :

```json
{{ $json.message.content }}
```

---

## Format StructuredNeed (pour normalizedUpdate)

Quand le modèle détecte des infos, il peut renvoyer dans `normalizedUpdate` :

```json
{
  "persona": {
    "name": "...",
    "role": "Chef produit marketing",
    "businessUnit": "Cardiologie",
    "geography": "EMEA"
  },
  "painPoints": [{
    "theme": "Creation slides",
    "rootCause": "Processus manuel",
    "impact": "3h/jour",
    "frequency": "high",
    "kpiAffected": "Time to market"
  }],
  "dataFootprint": {
    "sources": [{
      "label": "Campaign Reports",
      "location": "SharePoint",
      "dataType": "Excel",
      "sensitivity": "internal",
      "approximateVolume": "50 fichiers",
      "refreshRate": "Hebdomadaire",
      "ingestionNeed": "read",
      "owner": "Equipe marketing"
    }]
  },
  "copilotOpportunities": [{
    "name": "Resume articles",
    "phase": "discover",
    "trigger": "Upload PDF SharePoint",
    "inputSignals": ["PDF scientifique"],
    "expectedOutput": "Resume structure endpoints/populations",
    "successMetric": "Gain 2h30/semaine",
    "priority": "must-have"
  }],
  "strategicFit": {
    "importance": "high",
    "frequency": "high",
    "rationale": "Usage quotidien fort impact"
  }
}
```

Le modèle n'a **pas besoin** de tout remplir à chaque tour, juste les nouveaux éléments extraits de la réponse utilisateur.

---

## Test du webhook

Une fois configuré, teste en envoyant :

```bash
curl -X POST https://n8n.../webhook-test/d10cfbf3-1516-4c7e-9150-d326f383de10 \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Bonjour"}
    ],
    "phase": "contexte"
  }'
```

Tu dois recevoir :
```json
{
  "reply": "Bonjour, je suis Helios...",
  "phase": "contexte",
  "status": "continue",
  "normalizedUpdate": {},
  "responseId": "n8n-..."
}
```

Netlify redéploie. Une fois en ligne, le chat passera par n8n et le canevas sera éditable !

