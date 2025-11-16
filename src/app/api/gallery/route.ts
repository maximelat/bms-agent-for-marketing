import { NextResponse } from "next/server";

const fallbackGalleryUrl = "https://n8n-byhww-u43341.vm.elestio.app/webhook/5abf522a-fd25-4168-a020-f50f10024ffd";

export async function GET() {
  try {
    const galleryUrl = process.env.N8N_WEBHOOK_GET_GALLERY || fallbackGalleryUrl;
    
    const response = await fetch(galleryUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("n8n gallery endpoint error");
    }

    const rawData = await response.json();
    console.log("Raw gallery data:", JSON.stringify(rawData).substring(0, 500));
    
    // n8n renvoie soit un array (plusieurs lignes) soit un objet (1 seule ligne)
    // On normalise en array
    const rows = Array.isArray(rawData) ? rawData : [rawData];
    
    // Reconstruire les objets propres
    const canvases = rows.map((row: any) => ({
      id: row.id || `canvas-${row.row_number || Date.now()}`,
      agentName: row["Agent-Name"] || row.agentName || "Agent sans nom",
      agentDescription: row["Agent-Description"] || row.agentDescription || "Description à définir",
      Persona: row.Persona || row.persona || "À définir",
      painpoint: row.painpoint || "À définir",
      opportunitécopilot: row.opportunitécopilot || "À définir",
      problemToSolve: row.problemToSolve || "À définir",
      useCaseDescription: row.useCaseDescription || "À définir",
      dataAndProductUsed: (() => {
        try {
          // Nettoyer les caractères problématiques avant parsing
          const cleaned = (row.dataAndProductUsed || "[]")
            .replace(/–/g, "-")
            .replace(/"/g, '"')
            .replace(/"/g, '"');
          return JSON.parse(cleaned);
        } catch (e) {
          console.error("Parse dataAndProductUsed error:", e);
          // Reconstruire depuis les clés individuelles
          const arr = [];
          for (let i = 0; i < 10; i++) {
            if (row[`dataAndProductUsed[${i}]`]) {
              arr.push(row[`dataAndProductUsed[${i}]`]);
            }
          }
          return arr.length > 0 ? arr : ["À définir"];
        }
      })(),
      businessObjective: row.businessObjective || "À définir",
      keyResults: (() => {
        try {
          const cleaned = (row.keyResults || "[]")
            .replace(/–/g, "-")
            .replace(/"/g, '"')
            .replace(/"/g, '"');
          return JSON.parse(cleaned);
        } catch (e) {
          console.error("Parse keyResults error:", e);
          const arr = [];
          for (let i = 0; i < 10; i++) {
            if (row[`keyResults[${i}]`]) {
              arr.push(row[`keyResults[${i}]`]);
            }
          }
          return arr.length > 0 ? arr : [];
        }
      })(),
      stakeholders: (() => {
        try {
          const cleaned = (row.stakeholders || "[]")
            .replace(/–/g, "-")
            .replace(/"/g, '"')
            .replace(/"/g, '"');
          return JSON.parse(cleaned);
        } catch (e) {
          console.error("Parse stakeholders error:", e);
          return [];
        }
      })(),
      strategicFit: {
        importance: row["strategicFit.importance"] || "medium",
        frequency: row["strategicFit.frequency"] || "medium",
        rationale: row["strategicFit.rationale"] || "",
      },
      votes: parseInt(row.votes) || 0,
      voters: (() => {
        try {
          return JSON.parse(row.voters || "[]");
        } catch {
          return [];
        }
      })(),
      createdAt: row.createdAt || new Date().toISOString(),
      submittedBy: row.submittedBy || "anonymous",
    }));
    
    console.log("Parsed canvases:", canvases.length, "items");
    
    return NextResponse.json({
      canvases,
    });
  } catch (error) {
    console.error("gallery fetch error", error);
    return NextResponse.json(
      { error: "Impossible de récupérer la galerie.", canvases: [] },
      { status: 500 },
    );
  }
}

// Vote pour un canevas
export async function POST(request: Request) {
  try {
    const { canvasId, voterEmail } = await request.json();
    
    if (!canvasId || !voterEmail) {
      return NextResponse.json(
        { error: "canvasId et voterEmail requis" },
        { status: 400 },
      );
    }

    const voteUrl = process.env.N8N_WEBHOOK_VOTE || "https://n8n-byhww-u43341.vm.elestio.app/webhook/79f3c8db-9eb9-420a-b681-0db016ce6b00";
    
    console.log("Sending vote to:", voteUrl);
    console.log("Vote payload:", { email: voterEmail, id: canvasId });
    
    const response = await fetch(voteUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: voterEmail,
        id: canvasId,
      }),
    });

    console.log("Vote response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("n8n vote endpoint error:", errorText);
      return NextResponse.json(
        { error: `Erreur webhook n8n: ${response.status}`, details: errorText },
        { status: 500 },
      );
    }

    // Essayer de parser la réponse JSON, mais ne pas échouer si ce n'est pas du JSON
    let data = null;
    try {
      const responseText = await response.text();
      if (responseText) {
        data = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.log("Response is not JSON, that's ok");
    }
    
    console.log("Vote successful, response data:", data);
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("vote error (caught):", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer le vote.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

