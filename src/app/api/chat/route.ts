import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { randomUUID } from "crypto";
import type {
  ResponseInput,
  EasyInputMessage,
  ResponseOutputMessage,
} from "openai/resources/responses/responses";
import {
  buildSystemPrompt,
  buildSystemPromptV2,
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
  agentVersion: z.enum(["v1", "v2"]).optional(),
});

const agentResponseSchema = z.object({
  reply: z.string(),
  phase: z.enum(AGENT_PHASES),
  status: z.enum(["continue", "ready"]),
  normalizedUpdate: z.record(z.string(), z.any()).optional(),
});

const selectModelForPhase = (phase?: AgentPhase) => {
  switch (phase) {
    case "contexte":
      return (
        process.env.OPENAI_MODEL_FAST ??
        process.env.OPENAI_MODEL ??
        "gpt-5-nano"
      );
    case "pain-points":
    case "donnees":
    case "copilot":
    case "automation-avancee":
      return (
        process.env.OPENAI_MODEL_BALANCED ??
        process.env.OPENAI_MODEL ??
        "gpt-5-mini"
      );
    case "normalisation":
      return (
        process.env.OPENAI_MODEL_PREMIUM ??
        process.env.OPENAI_MODEL ??
        "gpt-5.1"
      );
    default:
      return process.env.OPENAI_MODEL ?? "gpt-5-mini";
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
    const systemMessage: EasyInputMessage = {
      role: "system",
      content: [
        {
          type: "input_text",
          text:
            parsed.data.agentVersion === "v2"
              ? buildSystemPromptV2()
              : buildSystemPrompt(),
        },
      ],
    };

    const conversationMessages = parsed.data.messages.map((message, index) => {
      if (message.role === "assistant") {
        const assistantMessage: ResponseOutputMessage = {
          id: `assistant-${index}-${randomUUID()}`,
          role: "assistant",
          status: "completed",
          type: "message",
          content: [
            {
              type: "output_text",
              text: message.content,
              annotations: [],
            },
          ],
        };
        return assistantMessage;
      }

      const userMessage: EasyInputMessage = {
        role: message.role,
        content: [{ type: "input_text", text: message.content }],
      };
      return userMessage;
    });

    const input: ResponseInput = [systemMessage, ...conversationMessages];

    const completion = await openai.responses.create({
      model: selectModelForPhase(parsed.data.phase),
      reasoning: { effort: "none" },
      input,
    });

    const raw =
      (completion.output ?? [])
        .flatMap((item: any) => item.content ?? [])
        .find((contentItem: any) => contentItem.type === "output_text")?.text ??
      "{}";
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

