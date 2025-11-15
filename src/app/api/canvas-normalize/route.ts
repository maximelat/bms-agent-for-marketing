import { NextResponse } from "next/server";
import { z } from "zod";
import { StructuredNeed } from "@/lib/structuredNeed";

const fallbackWebhook = "https://n8n-byhww-u43341.vm.elestio.app/webhook/canvas-normalize";

const requestSchema = z.object({
  structuredNeed: z.custom<StructuredNeed>(),
  transcript: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
  canvasId: z.string(),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = requestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalide", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const transcriptText = parsed.data.transcript
      .map((m) => `${m.role === "assistant" ? "Helios" : "Utilisateur"}: ${m.content}`)
      .join("\n\n");

    const webhookUrl = process.env.N8N_WEBHOOK_CANVAS_NORMALIZE || fallbackWebhook;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "canvas-normalization-request",
        canvasId: parsed.data.canvasId,
        transcriptText,
        structuredNeed: parsed.data.structuredNeed,
        requestedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error("Webhook n8n a retourné une erreur");
    }

    const rawData = await response.json();
    
    // n8n peut renvoyer soit { normalizedCanvas: ..., structuredNeedUpdate: ... } soit [{ output: "..." }]
    let normalizedCanvas;
    let structuredNeedUpdate;
    
    if (Array.isArray(rawData) && rawData[0]?.output) {
      // Format n8n avec output stringifié
      const outputString = rawData[0].output;
      const parsedOutput = JSON.parse(outputString);
      normalizedCanvas = parsedOutput.normalizedCanvas;
      structuredNeedUpdate = parsedOutput.structuredNeedUpdate;
    } else if (rawData.normalizedCanvas) {
      // Format direct
      normalizedCanvas = rawData.normalizedCanvas;
      structuredNeedUpdate = rawData.structuredNeedUpdate;
    } else {
      normalizedCanvas = rawData;
      structuredNeedUpdate = {};
    }

    return NextResponse.json({
      success: true,
      normalizedCanvas,
      structuredNeedUpdate,
    });
  } catch (error) {
    console.error("canvas-normalize error", error);
    return NextResponse.json(
      { error: "Impossible de normaliser le canevas via n8n." },
      { status: 500 },
    );
  }
}

