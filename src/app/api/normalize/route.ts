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

    const transcriptText = parsed.data.transcript
      .map((m) => `${m.role === "assistant" ? "Helios" : "Utilisateur"}: ${m.content}`)
      .join("\n\n");

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_PREMIUM || "gpt-5.1",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Voici la transcription complète de l'entretien :\n\n${transcriptText}\n\nDonnées déjà collectées :\n${JSON.stringify(parsed.data.structuredNeed, null, 2)}\n\nNormalise ce use case et complète les champs manquants.`,
        },
      ],
      response_format: { type: "json_object" },
    });

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

