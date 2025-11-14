import Link from "next/link";
import { RealtimeConsole } from "@/components/RealtimeConsole";

const realtimeOptions = [
  {
    id: "gpt-realtime",
    title: "gpt-realtime",
    description:
      "Session WebRTC ou WebSocket avec texte + audio en entrée/sortie. Idéal pour ateliers live multi-utilisateurs.",
    latency: "< 400 ms",
    payload: "Realtime Session API",
    actions: ["Streaming text", "Synthèse vocale", "Interruption mid-sentence"],
  },
  {
    id: "gpt-realtime-mini",
    title: "gpt-realtime-mini",
    description: "Version économique pour prototypes ou kiosques audio.",
    latency: "< 250 ms",
    payload: "Realtime Session API",
    actions: ["Streaming text", "Audio continu"],
  },
];

const audioOptions = [
  {
    id: "gpt-audio",
    title: "gpt-audio",
    description:
      "Utilise l’API Chat Completions avec `audio: {voice: \"alloy\"}`. Parfait pour lire les synthèses Helios automatiquement.",
  },
  {
    id: "gpt-audio-mini",
    title: "gpt-audio-mini",
    description:
      "Option économique pour réponses vocales courtes (confirmations, statuts, rappels).",
  },
];

export default function RealtimePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#03030b] via-[#070513] to-[#010109] py-12 text-white">
      <div className="pointer-events-none absolute inset-x-[8%] top-0 h-64 rounded-full bg-gradient-to-r from-[#f472b6]/40 via-[#7c3aed]/30 to-transparent blur-[160px]" />
      <main className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.45em] text-pink-300/90">Helios · Modalités audio & live</p>
          <h1 className="text-4xl font-semibold text-white">Sessions synchrones & assistants vocaux</h1>
          <p className="max-w-3xl text-lg text-slate-300">
            Besoin d’un atelier collectif ou d’une expérience audio mains libres ? Cette page recense les deux options
            OpenAI à brancher sur Helios : le flux Realtime (WebRTC/WebSocket) et les sorties audio via Chat Completions.
          </p>
          <Link href="/" className="inline-flex items-center text-sm text-pink-200 underline underline-offset-4">
            ← Retour au questionnaire classique
          </Link>
        </header>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-1 shadow-[0_35px_120px_rgba(1,0,8,0.8)]">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/60">
            <RealtimeConsole />
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/15 bg-white/5 p-6 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-pink-200">Flow Realtime (live)</p>
            <p className="text-sm text-slate-200">
              Idéal pour co-animer un entretien Helios et capturer les verbatims instantanément. L’agent côté navigateur
              ouvre un token de session, puis pousse micro + chat au modèle.
            </p>
            <ol className="space-y-2 text-sm text-slate-300">
              <li>1. Backend : `POST /v1/realtime/sessions` avec `model: gpt-realtime`.</li>
              <li>2. Le client reçoit un `client_secret` temporaire (TTL ∼1 min).</li>
              <li>3. Connexion WebRTC/WebSocket → streaming texte + audio.</li>
              <li>4. Helios alimente `StructuredNeed` à partir du transcript.</li>
            </ol>
          </div>
          <div className="space-y-4">
            {realtimeOptions.map((option) => (
              <div
                key={option.id}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 backdrop-blur"
              >
                <p className="text-lg font-semibold text-white">{option.title}</p>
                <p className="text-sm text-slate-200">{option.description}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>
                    <dt className="uppercase text-slate-400">latence</dt>
                    <dd>{option.latency}</dd>
                  </div>
                  <div>
                    <dt className="uppercase text-slate-400">payload</dt>
                    <dd>{option.payload}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs uppercase tracking-wide text-cyan-200">Capacités</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-100 marker:text-pink-400">
                  {option.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/15 bg-white/5 p-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-pink-200">Flow Audio</p>
            <p className="text-sm text-slate-200">
              Utilise la même API que le chat Helios, avec{" "}
              <code className="rounded bg-white/10 px-1 font-mono text-xs text-pink-200">
                modalities: [&quot;text&quot;, &quot;audio&quot;]
              </code>{" "}
              et{" "}
              <code className="rounded bg-white/10 px-1 font-mono text-xs text-pink-200">audio.voice</code>. Permet
              d’envoyer la synthèse vers Teams ou de créer des assistants voix pour les événements terrain.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/60 p-4 text-xs text-pink-200">
{`await openai.chat.completions.create({
  model: "gpt-audio",
  modalities: ["text", "audio"],
  audio: { voice: "alloy" },
  input: transcript,
});`}
            </pre>
            <p className="mt-3 text-xs text-slate-400">
              Le flux audio (base64) peut être restitué côté navigateur via l’API Web Audio ou diffusé dans Teams Rooms.
            </p>
          </div>
          <div className="space-y-4">
            {audioOptions.map((option) => (
              <div
                key={option.id}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 backdrop-blur"
              >
                <p className="text-lg font-semibold text-white">{option.title}</p>
                <p className="text-sm text-slate-200">{option.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/15 bg-gradient-to-r from-[#1d1b2f]/70 via-[#0f0b1c]/80 to-[#1d1427]/60 p-6">
          <h2 className="text-2xl font-semibold text-white">Roadmap d’intégration</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-200 marker:text-pink-400">
            <li>Phase pilote : brancher gpt-realtime sur un atelier interne (lien Teams + Helios live).</li>
            <li>Phase audio : diffuser automatiquement les synthèses Helios (gpt-audio-mini) après chaque entretien.</li>
            <li>
              Phase avancée : combiner transcription Realtime + `StructuredNeed` pour préremplir les fiches MDM sans saisie.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

