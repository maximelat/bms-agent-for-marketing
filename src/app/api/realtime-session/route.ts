import { NextResponse } from "next/server";

const REALTIME_ENDPOINT = "https://api.openai.com/v1/realtime/sessions";

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY manquant." },
      { status: 500 },
    );
  }

  const model =
    process.env.OPENAI_REALTIME_MODEL ??
    process.env.OPENAI_MODEL_REALTIME ??
    "gpt-realtime";

  try {
    const response = await fetch(REALTIME_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "realtime=v1",
      },
      body: JSON.stringify({
        model,
        voice: "alloy",
        modalities: ["text", "audio"],
        instructions: [
          "Tu es Helios, facilitateur Copilot pour les équipes marketing en industrie pharmaceutique.",
          "Ta mission : 1) faire préciser le rôle, les objectifs et les Painpoints quotidiens avec des ordres de grandeur chiffrés,",
          "2) cartographier les sources de données M365 (type, localisation, propriétaire, fréquence, sensibilité),",
          "3) identifier des opportunités d’agents Copilot/automatisations et valider le strategic fit (importance, fréquence, rationale).",
          "Pose une seule question à la fois, reformule les points clés, reste synthétique (≤45 secondes) et conclus toujours par une question claire."
        ].join(" "),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Realtime session error", data);
      return NextResponse.json({ error: "Impossible de créer la session." }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Realtime session route error", error);
    return NextResponse.json({ error: "Erreur serveur realtime." }, { status: 500 });
  }
}

