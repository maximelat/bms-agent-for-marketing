import { z } from "zod";
import { AGENT_PHASES } from "./agentPrompt";

export const agentResponseSchema = z.object({
  reply: z.string(),
  phase: z.enum(AGENT_PHASES),
  status: z.enum(["continue", "ready"]),
  normalizedUpdate: z.record(z.string(), z.any()).optional(),
});

