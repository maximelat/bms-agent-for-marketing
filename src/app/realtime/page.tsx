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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 text-white">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Helios · Modalités audio & live</p>
          <h1 className="text-4xl font-semibold text-white">Sessions synchrones & assistants vocaux</h1>
          <p className="max-w-3xl text-lg text-slate-300">
            Besoin d’un atelier collectif ou d’une expérience audio mains libres ? Cette page recense les deux options
            OpenAI à brancher sur Helios : le flux Realtime (WebRTC/WebSocket) et les sorties audio via Chat Completions.
          </p>
          <Link href="/" className="inline-flex items-center text-sm text-emerald-300 underline underline-offset-4">
            ← Retour au questionnaire classique
          </Link>
        </header>

        <RealtimeConsole />

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Flow Realtime (live)</p>
            <p className="text-sm text-slate-300">
              Idéal pour co-animer un entretien Helios et capturer les verbatims instantanément. L’agent côté navigateur
              ouvre un token de session, puis pousse micro + chat au modèle.
            </p>
            <ol className="space-y-2 text-sm text-slate-200">
              <li>1. Côté backend, `POST /v1/realtime/sessions` avec `model: gpt-realtime`.</li>
              <li>2. Le client reçoit un `client_secret` temporaire (TTL ∼1 min).</li>
              <li>3. Connexion via WebRTC ou WebSocket → streaming texte+audio.</li>
              <li>4. Helios peut continuer à remplir `StructuredNeed` en parallèle grâce au transcript.</li>
            </ol>
          </div>
          <div className="space-y-4">
            {realtimeOptions.map((option) => (
              <div key={option.id} className="rounded-2xl border border-white/10 bg-white/10 p-4">
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
                <p className="mt-3 text-xs uppercase tracking-wide text-emerald-200">Capacités</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-200">
                  {option.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Flow Audio</p>
            <p className="text-sm text-slate-300">
              Utilise la même API que le chat Helios, avec{" "}
              <code className="rounded bg-white/10 px-1 font-mono text-xs text-emerald-200">
                modalities: [&quot;text&quot;, &quot;audio&quot;]
              </code>{" "}
              et{" "}
              <code className="rounded bg-white/10 px-1 font-mono text-xs text-emerald-200">audio.voice</code>. Permet
              d’envoyer la synthèse vers Teams ou de créer des assistants voix pour les événements terrain.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-black/50 p-4 text-xs text-emerald-200">
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
              <div key={option.id} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-lg font-semibold text-white">{option.title}</p>
                <p className="text-sm text-slate-200">{option.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-300/30 bg-emerald-500/10 p-6 text-emerald-100">
          <h2 className="text-2xl font-semibold text-white">Roadmap d’intégration</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
            <li>Phase pilote : brancher gpt-realtime sur un atelier interne (lien invite Teams + Helios live).</li>
            <li>Phase audio : diffuser automatiquement les synthèses Helios (gpt-audio-mini) après chaque entretien.</li>
            <li>
              Phase avancée : combiner transcription Realtime + `StructuredNeed` pour préremplir les fiches MDM sans
              saisie.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

