import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import type {
  EasyInputMessage,
  ResponseInput,
  ResponseOutputMessage,
} from "openai/resources/responses/responses";

import {
  buildSystemPrompt,
  buildSystemPromptV2,
} from "@/lib/agentPrompt";
import { agentResponseSchema } from "@/lib/agentResponseSchema";
import { defaultStructuredNeed } from "@/lib/structuredNeed";
import { mergeStructuredNeed } from "@/lib/mergeStructuredNeed";

const requestSchema = z.object({
  transcript: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
  agentVersion: z.enum(["v1", "v2"]).optional(),
});

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

    const conversationMessages = parsed.data.transcript.map(
      (message, index) => {
        if (message.role === "assistant") {
          const assistantMessage: ResponseOutputMessage = {
            id: `msg_recap_${index}`,
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
          role: "user",
          content: [{ type: "input_text", text: message.content }],
        };
        return userMessage;
      },
    );

    const input: ResponseInput = [systemMessage, ...conversationMessages];

    const completion = await openai.responses.create({
      model:
        process.env.OPENAI_MODEL_PREMIUM ??
        process.env.OPENAI_MODEL ??
        "gpt-5.1",
      reasoning: { effort: "medium" },
      input,
    });

    const raw =
      (completion.output ?? [])
        .flatMap((item: any) => item.content ?? [])
        .find((contentItem: any) => contentItem.type === "output_text")?.text ??
      "{}";
    const asJson = JSON.parse(raw);
    const agent = agentResponseSchema.parse(asJson);
    const report = mergeStructuredNeed(
      defaultStructuredNeed,
      agent.normalizedUpdate,
    );

    return NextResponse.json({
      report,
      agent,
      completionId: completion.id,
    });
  } catch (error) {
    console.error("realtime report error", error);
    return NextResponse.json(
      { error: "Impossible de générer le rapport realtime." },
      { status: 500 },
    );
  }
}


