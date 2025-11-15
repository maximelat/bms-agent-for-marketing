import { NextResponse } from "next/server";
import { z } from "zod";
import { StructuredNeed } from "@/lib/structuredNeed";
import { UseCaseCanvas } from "@/lib/useCaseCanvas";
import { convertToCanvas } from "@/lib/convertToCanvas";

const fallbackWebhook = "https://n8n-byhww-u43341.vm.elestio.app/webhook/b9b80ad2-991f-419b-bfaf-7d8faca3de72";

const finalizeSchema = z.object({
  structuredNeed: z.custom<StructuredNeed>(),
  useCaseCanvas: z.custom<UseCaseCanvas>().optional(),
  transcript: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional(),
  recipientEmail: z.string().email().optional(),
  sessionId: z.string().optional(),
});

const sendWebhook = async (
  need: StructuredNeed,
  canvas: UseCaseCanvas,
  recipientEmail?: string,
  transcript?: { role: string; content: string }[],
) => {
  const url = process.env.N8N_WEBHOOK_URL ?? fallbackWebhook;
  
  const payload = {
    type: "bms-agentic-need",
    capturedAt: new Date().toISOString(),
    
    // Format brut (pour archivage)
    structuredNeed: need,
    
    // Format canevas (pour normalisation côté n8n)
    useCaseCanvas: canvas,
    
    // Transcription complète (pour que l'agent n8n puisse analyser)
    transcript: transcript || [],
    transcriptText: transcript
      ? transcript.map((m) => `${m.role === "assistant" ? "Helios" : "Utilisateur"}: ${m.content}`).join("\n\n")
      : "",
    
    // Métadonnées
    recipientEmail,
    interviewDuration: transcript ? `${Math.ceil(transcript.length / 2)} échanges` : "N/A",
    
    // Statut pour n8n
    needsNormalization: true, // Signal que n8n doit lancer l'agent
    canvasId: canvas.id,
  };
  
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = finalizeSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalide", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    // Utiliser le canevas fourni ou le générer
    const canvas = parsed.data.useCaseCanvas || convertToCanvas(
      parsed.data.structuredNeed,
      parsed.data.recipientEmail ?? "anonymous",
    );
    
    await sendWebhook(
      parsed.data.structuredNeed,
      canvas,
      parsed.data.recipientEmail,
      parsed.data.transcript,
    );
    
    return NextResponse.json({ 
      ok: true,
      canvasId: canvas.id,
      message: "Rapport envoyé ! Vous serez invité à voter pour les meilleurs canevas prochainement.",
    });
  } catch (error) {
    console.error("finalize error", error);
    return NextResponse.json({ error: "Échec de la finalisation" }, { status: 500 });
  }
}

