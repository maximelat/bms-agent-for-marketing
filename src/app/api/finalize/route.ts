import { NextResponse } from "next/server";
import { z } from "zod";
import { StructuredNeed } from "@/lib/structuredNeed";

const fallbackWebhook = "https://n8n-byhww-u43341.vm.elestio.app/webhook/b9b80ad2-991f-419b-bfaf-7d8faca3de72";

const finalizeSchema = z.object({
  structuredNeed: z.custom<StructuredNeed>(),
  transcript: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional(),
});

const sendWebhook = async (need: StructuredNeed, transcript?: { role: string; content: string }[]) => {
  const url = process.env.N8N_WEBHOOK_URL ?? fallbackWebhook;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "bms-agentic-need",
      capturedAt: new Date().toISOString(),
      structuredNeed: need,
      transcript,
    }),
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
    await sendWebhook(parsed.data.structuredNeed, parsed.data.transcript);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("finalize error", error);
    return NextResponse.json({ error: "Échec de la finalisation" }, { status: 500 });
  }
}

