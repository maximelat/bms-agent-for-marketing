import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GALLERY_API_URL = process.env.N8N_WEBHOOK_GET_GALLERY || "https://n8n-byhww-u43341.vm.elestio.app/webhook/5abf522a-fd25-4168-a020-f50f10024ffd";
const CLASSIFY_WEBHOOK_URL = "https://n8n-byhww-u43341.vm.elestio.app/webhook/ca0d8010-e38f-464f-8f47-450134a08fb3";

export async function POST() {
  try {
    // 1. Récupérer tous les canvas
    const galleryResponse = await fetch(GALLERY_API_URL);
    if (!galleryResponse.ok) {
      throw new Error("Impossible de récupérer la galerie");
    }

    const rawData = await galleryResponse.json();
    const canvases = Array.isArray(rawData) ? rawData : [rawData];

    let classified = 0;

    // 2. Pour chaque canvas, faire une classification
    for (const canvas of canvases) {
      if (!canvas.agentName && !canvas["Agent-Name"]) continue;

      const agentName = canvas.agentName || canvas["Agent-Name"] || "";
      const agentDescription = canvas.agentDescription || canvas["Agent-Description"] || "";

      // Appeler OpenAI pour classification
      const category = await classifyAgent(agentName, agentDescription);

      // Calculer le score strategic fit
      const strategicScore = calculateStrategicScore(
        canvas["strategicFit.importance"] || "medium",
        canvas["strategicFit.frequency"] || "medium"
      );

      // Envoyer à n8n pour stockage dans Google Sheets
      const classificationData = {
        id: canvas.id,
        category,
        strategicScore,
        agentName,
        agentDescription,
        classifiedAt: new Date().toISOString(),
      };

      console.log("Sending classification for:", canvas.id, classificationData);

      const updateResponse = await fetch(CLASSIFY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classificationData),
      });

      if (updateResponse.ok) {
        console.log(`✅ Canvas ${canvas.id} classified as ${category}`);
        classified++;
      } else {
        console.error(`❌ Failed to classify canvas ${canvas.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      classified,
      total: canvases.length,
    });
  } catch (error) {
    console.error("Classification error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la classification" },
      { status: 500 }
    );
  }
}

async function classifyAgent(name: string, description: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.warn("OpenAI API key not configured");
    return "Non classifié";
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en classification d'agents IA pour les métiers d'entreprise. Ta tâche est de catégoriser les agents selon leur domaine métier. Réponds UNIQUEMENT avec une catégorie parmi: Marketing, Vente, Finance, RH, IT, Juridique, Production, Logistique, R&D, Support Client, Stratégie, Autre. Réponds avec UN SEUL MOT."
          },
          {
            role: "user",
            content: `Nom de l'agent: ${name}\nDescription: ${description}\n\nCatégorie métier:`
          }
        ],
        temperature: 0.3,
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API error");
    }

    const data = await response.json();
    const category = data.choices[0]?.message?.content?.trim() || "Non classifié";
    
    return category;
  } catch (error) {
    console.error("OpenAI classification error:", error);
    return "Non classifié";
  }
}

function calculateStrategicScore(importance: string, frequency: string): number {
  const importanceScore = importance === "high" ? 3 : importance === "medium" ? 2 : 1;
  const frequencyScore = frequency === "high" ? 3 : frequency === "medium" ? 2 : 1;
  
  // Score de 1 à 9
  return importanceScore * frequencyScore;
}

