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
    
    // n8n renvoie un array d'objets aplatis avec des clés comme "dataAndProductUsed[0]"
    // On doit reconstruire les objets propres
    const canvases = Array.isArray(rawData) ? rawData.map((row: any) => ({
      id: row.id || `canvas-${row.row_number}`,
      Persona: row.Persona || row.persona || "",
      painpoint: row.painpoint || "",
      opportunitécopilot: row.opportunitécopilot || "",
      problemToSolve: row.problemToSolve || "",
      useCaseDescription: row.useCaseDescription || "",
      dataAndProductUsed: (() => {
        try {
          return JSON.parse(row.dataAndProductUsed || "[]");
        } catch {
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
      businessObjective: row.businessObjective || "",
      keyResults: (() => {
        try {
          return JSON.parse(row.keyResults || "[]");
        } catch {
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
          return JSON.parse(row.stakeholders || "[]");
        } catch {
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
    })) : [];
    
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

    const voteUrl = process.env.N8N_WEBHOOK_VOTE || "https://n8n-byhww-u43341.vm.elestio.app/webhook/vote";
    
    const response = await fetch(voteUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "canvas-vote",
        canvasId,
        voterEmail,
        votedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error("n8n vote endpoint error");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("vote error", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer le vote." },
      { status: 500 },
    );
  }
}

