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
import { agentResponseSchema } from "@/lib/agentResponseSchema";

const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
  phase: z.enum(AGENT_PHASES).optional(),
  agentVersion: z.enum(["v1", "v2"]).optional(),
  previousResponseId: z.string().optional(),
});

type IncomingMessage = z.infer<typeof requestSchema>["messages"][number];

const REASONING_MODELS = ["gpt-5.1", "gpt-5", "gpt-5-mini", "gpt-5-nano", "o3", "o1"];

const selectModelForPhase = (phase?: AgentPhase) => {
  if (phase === "normalisation") {
      return (
      process.env.OPENAI_MODEL_PREMIUM?.trim() ||
      process.env.OPENAI_MODEL?.trim() ||
        "gpt-5.1"
      );
  }

  // Toutes les autres phases utilisent un modèle rapide sans reasoning
  return (
    process.env.OPENAI_MODEL_FAST?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini"
  );
};

const isReasoningModel = (model: string): boolean => {
  return REASONING_MODELS.some((rm) => model.includes(rm));
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
  const model = selectModelForPhase(parsed.data.phase);
  
  if (!model) {
    return NextResponse.json(
      { error: "Aucun modèle sélectionné pour cette phase." },
      { status: 500 },
    );
  }

  const useReasoningAPI = isReasoningModel(model);

  try {
    const systemPrompt =
      parsed.data.agentVersion === "v2"
        ? buildSystemPromptV2()
        : buildSystemPrompt();

    if (useReasoningAPI) {
      // Modèle reasoning → Responses API
      const systemMessage: EasyInputMessage = {
          role: "system",
        content: [{ type: "input_text", text: systemPrompt }],
      };

      const conversationMessages = parsed.data.messages.map(
        (message: IncomingMessage, index: number) => {
          if (message.role === "assistant") {
            const assistantMessage: ResponseOutputMessage = {
              id: `msg_${index}_${randomUUID()}`,
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
        },
      );

      const input: ResponseInput = [systemMessage, ...conversationMessages];

      const reasoning = model.includes("5.1")
        ? { effort: "none" as const }
        : undefined;

      const completion = await openai.responses.create({
        model,
        ...(reasoning ? { reasoning } : {}),
        ...(parsed.data.previousResponseId?.startsWith("resp_")
          ? { previous_response_id: parsed.data.previousResponseId }
          : {}),
        input,
    });

    const raw =
      (completion.output ?? [])
        .flatMap((item: any) => item.content ?? [])
          .find((contentItem: any) => contentItem.type === "output_text")
          ?.text ?? "{}";
      
      // Nettoyer le texte avant parsing (enlever HTML/markdown accidentel)
      const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
      const asJson = JSON.parse(cleaned);
      const agent = agentResponseSchema.parse(asJson);

      return NextResponse.json({
        ...agent,
        responseId: completion.id,
      });
    } else {
      // Modèle non-reasoning → Chat Completions API
      // On envoie l'historique complet pour garder le contexte
      const chatMessages = [
        { role: "system" as const, content: systemPrompt },
        ...parsed.data.messages.map((m: IncomingMessage) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const completion = await openai.chat.completions.create({
        model,
        messages: chatMessages,
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      
      // Nettoyer le texte avant parsing (enlever HTML/markdown accidentel)
      const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
      const asJson = JSON.parse(cleaned);
      
      // Logger pour debug
      console.log("Chat Completions response JSON:", asJson);
      
    const agent = agentResponseSchema.parse(asJson);

      return NextResponse.json({
        ...agent,
        responseId: completion.id,
      });
    }
  } catch (error) {
    console.error("chat route error", error);
    if (error instanceof Error && "issues" in error) {
      console.error("Validation errors:", (error as any).issues);
    }
    return NextResponse.json(
      { error: "Impossible d'interroger OpenAI." },
      { status: 500 },
    );
  }
}

