import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { StructuredNeed } from "@/lib/structuredNeed";
import { mergeStructuredNeed } from "@/lib/mergeStructuredNeed";

const normalizeSchema = z.object({
  structuredNeed: z.custom<StructuredNeed>(),
  transcript: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
});

const agentResponseSchema = z.object({
  normalizedUpdate: z.record(z.string(), z.any()),
  summary: z.string(),
  isComplete: z.boolean(),
});

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY manquant." },
      { status: 500 },
    );
  }

  const payload = await request.json();
  const parsed = normalizeSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalide", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const openai = new OpenAI({ apiKey });

  try {
    const systemPrompt = `
Tu es un agent de normalisation pour les entretiens Copilot pour des équipes de marketing en industrie pharmaceutique.
À partir de la transcription et des données collectées, complète le canevas use case.

IMPORTANT : produis un JSON valide strict. Évite les sauts de ligne dans les strings, échappe les guillemets.

Sortie attendue (JSON strict, une seule ligne par valeur) :
{
  "normalizedUpdate": {
    "expectedOutcomes": { "successKPIs": ["KPI1", "KPI2"] },
    "strategicFit": { "importance": "high", "frequency": "medium", "rationale": "courte phrase" },
    "nextSteps": ["step1", "step2"]
  },
  "summary": "Resume court sans guillemets ni retours ligne.",
  "isComplete": true
}

Règles strictes :
- Toutes les valeurs string sur UNE seule ligne
- Pas de guillemets non échappés
- Pas de sauts de ligne dans les valeurs
- Maximum 100 caractères par string
`;

    const transcriptText = parsed.data.transcript
      .map((m) => `${m.role === "assistant" ? "Helios" : "Utilisateur"}: ${m.content}`)
      .join("\n\n");

    // Utiliser gpt-4o-mini pour la normalisation (rapide, fiable, pas de timeout)
    const model = "gpt-4o-mini";
    const isReasoningModel = false;


    let completion;
    if (isReasoningModel) {
      // Utiliser Responses API pour les modèles reasoning avec effort low pour éviter timeout
      const responsesCompletion = await openai.responses.create({
        model,
        reasoning: { effort: "low" },
        max_output_tokens: 2000,
        input: [
          { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Transcription complète:\n${transcriptText}\n\nDonnées collectées:\n${JSON.stringify(parsed.data.structuredNeed)}\n\nComplète les champs manquants du canevas.`,
              },
            ],
          },
        ],
      });
      
      const rawText =
        (responsesCompletion.output ?? [])
          .flatMap((item: any) => item.content ?? [])
          .find((contentItem: any) => contentItem.type === "output_text")?.text ?? "{}";
      completion = { choices: [{ message: { content: rawText } }] };
    } else {
      // Chat Completions pour les autres modèles
      completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Transcription complète:\n${transcriptText}\n\nDonnées collectées:\n${JSON.stringify(parsed.data.structuredNeed)}\n\nComplète les champs manquants du canevas.`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
        temperature: 0.3,
      });
    }

    const raw = completion.choices[0]?.message?.content ?? "{}";
    
    // Nettoyage agressif pour éviter JSON malformé
    let cleaned = raw.trim()
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/i, "")
      .replace(/\n/g, " ")           // Enlever tous les sauts de ligne
      .replace(/\r/g, " ")           // Enlever retours chariot
      .replace(/\t/g, " ")           // Enlever tabs
      .replace(/\s{2,}/g, " ");      // Réduire espaces multiples
    
    let result;
    try {
      result = agentResponseSchema.parse(JSON.parse(cleaned));
    } catch (parseError) {
      console.error("JSON parse error, raw:", raw.substring(0, 500));
      // Fallback : retourner les données existantes
      return NextResponse.json({
        normalizedNeed: parsed.data.structuredNeed,
        summary: "Normalisation échouée (JSON malformé)",
        isComplete: false,
      });
    }

    const normalizedNeed = mergeStructuredNeed(
      parsed.data.structuredNeed,
      result.normalizedUpdate,
    );

    return NextResponse.json({
      normalizedNeed,
      summary: result.summary,
      isComplete: result.isComplete,
    });
  } catch (error) {
    console.error("normalize error", error);
    return NextResponse.json(
      { error: "Impossible de normaliser le use case." },
      { status: 500 },
    );
  }
}

