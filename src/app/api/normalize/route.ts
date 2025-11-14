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
Tu es un agent de normalisation pour les entretiens Copilot BMS.
À partir de la transcription complète et des données déjà collectées, ta mission est de :

1. Valider que tous les éléments du canevas use case sont complets :
   - Problem to solve (basé sur les pain points)
   - Use case description (basé sur les opportunités Copilot décrites)
   - Data & product used (sources identifiées + outils M365)
   - Business objective (objectifs métier chiffrés)
   - Key results (métriques de succès attendues)
   - Stakeholders (rôles impliqués, propriétaires)
   - Strategic fit (importance, fréquence, rationale)

2. Compléter les champs manquants ou ambigus en extrapolant intelligemment depuis la conversation.

3. Générer un résumé exécutif (2-3 paragraphes) qui synthétise le besoin, les opportunités et le strategic fit.

Sortie attendue (JSON strict) :
{
  "normalizedUpdate": {
    ... champs StructuredNeed complétés/corrigés pour remplir le canevas use case ...
  },
  "summary": "résumé exécutif du use case en 2-3 paragraphes",
  "isComplete": true si tous les champs du canevas sont remplis, false sinon
}
`;

    // Limiter la transcription aux 10 derniers échanges pour éviter timeout
    const recentTranscript = parsed.data.transcript.slice(-20); // 10 derniers échanges
    const transcriptText = recentTranscript
      .map((m) => `${m.role === "assistant" ? "Helios" : "Utilisateur"}: ${m.content}`)
      .join("\n\n");

    // Utiliser gpt-4o-mini pour la normalisation (plus rapide, évite timeout)
    
    const model = process.env.OPENAI_MODEL_PREMIUM || "gpt-5.1";
    const isReasoningModel = ["gpt-5", "o3", "o1"].some((rm) => model.includes(rm));


    let completion;
    if (isReasoningModel) {
      // Utiliser Responses API pour les modèles reasoning avec effort low pour éviter timeout
      const responsesCompletion = await openai.responses.create({
        model,
        reasoning: { effort: "none" },
        max_output_tokens: 1500,
        input: [
          { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Transcription récente:\n${transcriptText}\n\nDonnées collectées:\n${JSON.stringify(parsed.data.structuredNeed)}\n\nComplète les champs manquants du canevas.`,
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
            content: `Transcription récente:\n${transcriptText}\n\nDonnées collectées:\n${JSON.stringify(parsed.data.structuredNeed)}\n\nComplète les champs manquants du canevas.`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
        temperature: 0.3,
      });
    }

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    const result = agentResponseSchema.parse(JSON.parse(cleaned));

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

