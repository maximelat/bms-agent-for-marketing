import { NextResponse } from "next/server";

const n8nWebhook = "https://n8n-byhww-u43341.vm.elestio.app/webhook/d10cfbf3-1516-4c7e-9150-d326f383de10";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    const response = await fetch(n8nWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("n8n webhook error");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("chat-webhook error", error);
    return NextResponse.json(
      { error: "Impossible de contacter n8n." },
      { status: 500 },
    );
  }
}

