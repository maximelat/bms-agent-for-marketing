import { NextResponse } from "next/server";

const fallbackGalleryUrl = "https://n8n-byhww-u43341.vm.elestio.app/webhook/get-gallery";

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

    const canvases = await response.json();
    
    return NextResponse.json({
      canvases: canvases || [],
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

