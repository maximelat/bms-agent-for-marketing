import { NextResponse } from "next/server";

const n8nWebhook = "https://n8n-byhww-u43341.vm.elestio.app/webhook/d10cfbf3-1516-4c7e-9150-d326f383de10";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    console.log("Sending to n8n:", { webhook: n8nWebhook, payload });
    
    const response = await fetch(n8nWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("n8n response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("n8n error response:", errorText);
      throw new Error(`n8n webhook error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const rawData = await response.text();
    console.log("n8n raw response:", rawData.substring(0, 500));
    
    let data = JSON.parse(rawData);
    
    // Parsing robuste : gérer les différents formats de réponse n8n
    
    // Cas 1 : [{ output: "stringified JSON" }]
    if (Array.isArray(data) && data[0]?.output) {
      const outputString = data[0].output;
      const cleaned = outputString.trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "");
      data = JSON.parse(cleaned);
    }
    
    // Cas 2 : { message: { content: "stringified JSON" } }
    if (data.message?.content && typeof data.message.content === "string") {
      const cleaned = data.message.content.trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "");
      data = JSON.parse(cleaned);
    }
    
    // Cas 3 : string direct
    if (typeof data === "string") {
      const cleaned = data.trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "");
      data = JSON.parse(cleaned);
    }
    
    // Validation finale : s'assurer qu'on a bien reply, phase, status
    if (!data.reply || !data.phase || !data.status) {
      console.error("Invalid response format from n8n:", data);
      throw new Error("Format de réponse n8n invalide");
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("chat-webhook error", error);
    return NextResponse.json(
      { error: "Impossible de contacter n8n ou de parser la réponse." },
      { status: 500 },
    );
  }
}

