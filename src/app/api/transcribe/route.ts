import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY manquant." },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    if (!audioFile) {
      return NextResponse.json(
        { error: "Aucun fichier audio fourni." },
        { status: 400 },
      );
    }

    const openai = new OpenAI({ apiKey });
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-4o-transcribe",
      language: "fr",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error("transcribe error", error);
    return NextResponse.json(
      { error: "Impossible de transcrire l'audio." },
      { status: 500 },
    );
  }
}

