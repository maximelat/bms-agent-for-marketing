import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import {
  buildSystemPrompt,
  AGENT_PHASES,
  type AgentPhase,
} from "@/lib/agentPrompt";

const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
  phase: z.enum(AGENT_PHASES).optional(),
});

const agentResponseSchema = z.object({
  reply: z.string(),
  phase: z.enum(AGENT_PHASES),
  status: z.enum(["continue", "ready"]),
  normalizedUpdate: z.record(z.any()).optional(),
});

const selectModelForPhase = (phase?: AgentPhase) => {
  switch (phase) {
    case "contexte":
      return (
        process.env.OPENAI_MODEL_FAST ??
        process.env.OPENAI_MODEL ??
        "gpt-4o-mini"
      );
    case "pain-points":
    case "donnees":
    case "copilot":
    case "automation-avancee":
      return (
        process.env.OPENAI_MODEL_BALANCED ??
        process.env.OPENAI_MODEL ??
        "gpt-4.1-mini"
      );
    case "normalisation":
      return (
        process.env.OPENAI_MODEL_PREMIUM ??
        process.env.OPENAI_MODEL ??
        "gpt-4.1"
      );
    default:
      return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  }
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY manquant dans l'environnement." },
      { status: 500 },
    );
  }

  const payload = await request.json();
  const parsed = requestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalide", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: selectModelForPhase(parsed.data.phase),
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        ...parsed.data.messages,
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const asJson = JSON.parse(raw);
    const agent = agentResponseSchema.parse(asJson);

    return NextResponse.json(agent);
  } catch (error) {
    console.error("chat route error", error);
    return NextResponse.json(
      { error: "Impossible d'interroger OpenAI." },
      { status: 500 },
    );
  }
}

