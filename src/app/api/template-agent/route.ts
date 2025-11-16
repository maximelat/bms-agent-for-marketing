import { NextResponse } from "next/server";

const templateAgentUrl = "https://n8n-byhww-u43341.vm.elestio.app/webhook-test/62269d79-d231-4ee7-8ea0-90371261bd21";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const canvasId = searchParams.get("id");
    
    if (!canvasId) {
      return NextResponse.json(
        { error: "ID du canvas requis" },
        { status: 400 },
      );
    }

    // Appeler le webhook n8n avec l'ID du canvas
    const response = await fetch(`${templateAgentUrl}?id=${encodeURIComponent(canvasId)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération du template agent");
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("template agent fetch error", error);
    return NextResponse.json(
      { error: "Impossible de récupérer le template agent." },
      { status: 500 },
    );
  }
}

