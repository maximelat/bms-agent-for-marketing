import { NextResponse } from "next/server";
import { z } from "zod";
import { UseCaseCanvas } from "@/lib/useCaseCanvas";

const fallbackWebhook = "https://n8n-byhww-u43341.vm.elestio.app/webhook/add-to-gallery";

const requestSchema = z.object({
  canvas: z.custom<UseCaseCanvas>(),
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
    const webhookUrl = process.env.N8N_WEBHOOK_ADD_GALLERY || fallbackWebhook;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "add-to-gallery",
        canvas: parsed.data.canvas,
        addedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error("Webhook n8n a retourné une erreur");
    }

    return NextResponse.json({
      success: true,
      message: "Canevas ajouté à la galerie ! Vous pourrez voter prochainement.",
    });
  } catch (error) {
    console.error("add-to-gallery error", error);
    return NextResponse.json(
      { error: "Impossible d'ajouter à la galerie." },
      { status: 500 },
    );
  }
}

