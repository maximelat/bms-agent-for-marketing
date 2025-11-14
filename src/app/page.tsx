import { AgentPlayground } from "@/components/AgentPlayground";
import Link from "next/link";

const overviewCards = [
  {
    title: "3 temps forts",
    items: [
      "Exploration métier et irritants quantifiés.",
      "Cartographie fine des données (origine, volume, fréquence, confidentialité).",
      "Projection Copilot + scénarios d’automatisations avancées.",
    ],
  },
  {
    title: "Livrables normés",
    items: [
      "Objet StructuredNeed (JSON) prêt pour MDM / sheet.",
      "Matrice Strategic Fit (Importance x Fréquence).",
      "Résumé envoyé vers n8n + email (si SMTP configuré).",
    ],
  },
  {
    title: "Modes complémentaires",
    items: [
      <>
        Formulaire guidé : <Link href="/questionnaire" className="text-pink-300 underline underline-offset-4">Agent Questionnaire</Link>.
      </>,
      <>
        Sessions audio/WebRTC (gpt-realtime & gpt-audio) : <Link href="/realtime" className="text-pink-300 underline underline-offset-4">Mode Realtime</Link>.
      </>,
    ],
  },
  {
    title: "Prérequis",
    items: [
      "OPENAI_API_KEY valide (profil GPT-5 par défaut).",
      "N8N_WEBHOOK_URL optionnel, sinon valeur fournie.",
      "FTP_* + OVH_ADRESSE pour la CI/CD.",
    ],
  },
];

const beforeAfterCards = [
  {
    title: "Avant l’entretien",
    items: [
      "Préparez 2-3 exemples chiffrés (temps passé, volume d’emails, livrables/semaine…).",
      "Repérez vos sources de données majeures et leurs propriétaires.",
    ],
  },
  {
    title: "Pendant",
    items: [
      "Helios V1 (chat) ou V2 (trame questionnaire) avance une question à la fois.",
      "Chaque réponse alimente la transcription et la fiche StructuredNeed en direct.",
    ],
  },
  {
    title: "Après",
    items: [
      "Un rapport normalisé (JSON + matrice Strategic Fit) est généré automatiquement.",
      "Vous pouvez exporter la transcription complète pour partager le fil.",
    ],
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#04030a] via-[#0d0a16] to-[#05030a] text-white">
      <div className="pointer-events-none absolute inset-x-[10%] top-10 h-64 rounded-full bg-gradient-to-r from-[#eb54c7]/40 via-[#7c3aed]/30 to-[#2dd4bf]/30 blur-[140px]" />
      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-6 pr-0 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-6">
            <header className="space-y-5 text-center sm:text-left">
              <p className="text-xs uppercase tracking-[0.4em] text-pink-300/90">Bienvenue · Entretien Copilot BMS</p>
              <h1 className="text-4xl font-semibold text-white">Votre échange guidé pour cartographier les besoins agents</h1>
              <p className="max-w-3xl text-lg text-slate-200">
                Helios vous accompagne pour identifier les irritants de votre quotidien, cartographier vos données M365 et faire
                émerger les opportunités d’agents Copilot. La transcription et le rapport sont générés automatiquement.
              </p>
            </header>

            <section className="grid gap-4 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(2,2,10,0.65)] lg:grid-cols-4">
              {overviewCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:border-pink-400/40 hover:bg-white/10"
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-pink-200">{card.title}</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-200 marker:text-pink-400">
                    {card.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            <section className="grid gap-4 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(4,5,18,0.85)] lg:grid-cols-3">
              {beforeAfterCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:border-pink-400/30 hover:bg-white/10"
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-pink-200">{card.title}</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-200 marker:text-pink-400">
                    {card.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            <section className="grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(4,5,18,0.85)] lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wide text-emerald-200">Mode conversation</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Helios v1</h2>
                <p className="mt-2 text-sm text-slate-200">
                  Consultant virtuel, une question à la fois. Idéal live : Helios reformule, challenge les chiffres et garde le fil.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-200 marker:text-emerald-300">
                  <li>Conversation rapide (modèles nano/mini).</li>
                  <li>Transcription copiée dans le panneau de droite.</li>
                  <li>Rapport final validé pendant “normalisation”.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wide text-emerald-200">Mode questionnaire</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Helios v2</h2>
                <p className="mt-2 text-sm text-slate-200">
                  Aligné sur la trame formulaire : persona, irritants, données, strategic fit. Parfait pour avancer section par section.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-200 marker:text-emerald-300">
                  <li>Transcription complète accessible.</li>
                  <li>Résumé prêt à envoyer vers n8n / email.</li>
                  <li>Peut être poursuivi via `/questionnaire`.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-wide text-emerald-200">Mode audio</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Realtime + transcription</h2>
                <p className="mt-2 text-sm text-slate-200">
                  Session WebRTC voix + texte. La transcription est enregistrée et, à la coupure, un rapport StructuredNeed est généré automatiquement.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-200 marker:text-emerald-300">
                  <li>
                    Console audio : <Link href="/realtime" className="text-pink-300 underline">Mode Realtime</Link>.
                  </li>
                  <li>Prévoir un casque et accepter l’accès micro.</li>
                  <li>Rapport JSON exportable immédiatement.</li>
                </ul>
              </div>
            </section>

            <section className="grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_100px_rgba(2,4,16,0.8)] lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/90 p-6 text-zinc-900">
                <p className="text-xs uppercase tracking-wide text-emerald-600">Déroulé standard</p>
                <h3 className="mt-2 text-2xl font-semibold">Ce que va vous demander Helios</h3>
                <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-zinc-700">
                  <li>Contexte & irritants : rôle exact, périmètre, jalons, objectifs et irritants chiffrés.</li>
                  <li>Cartographie des données : emplacement, fréquence, propriétaire, sensibilité.</li>
                  <li>Idées Copilot & automatisations : déclencheur, entrée, résultat, KPI, dépendances.</li>
                  <li>Strategic Fit : importance, fréquence, rationale, prochaines étapes.</li>
                </ol>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/90 p-6 text-zinc-900">
                <p className="text-xs uppercase tracking-wide text-emerald-600">Checklist Realtime</p>
                <h3 className="mt-2 text-2xl font-semibold">Préparer la session audio</h3>
                <ul className="mt-4 space-y-3 text-sm text-zinc-700">
                  <li>
                    <span className="font-semibold text-emerald-700">1. Navigateur & micro :</span> ouvrez{" "}
                    <Link href="/realtime" className="text-emerald-600 underline underline-offset-4">
                      la console audio
                    </Link>{" "}
                    sous Chrome/Edge, branchez votre casque et autorisez le micro.
                  </li>
                  <li>
                    <span className="font-semibold text-emerald-700">2. Logs visibles :</span> la transcription apparaît en direct et peut être copiée.
                  </li>
                  <li>
                    <span className="font-semibold text-emerald-700">3. Coupure :</span> cliquez sur “Couper & générer le rapport” pour récupérer automatiquement la fiche StructuredNeed.
                  </li>
                  <li>
                    <span className="font-semibold text-emerald-700">4. Partage :</span> exportez rapport/transcription pour vos outils Copilot ou n8n sans action technique supplémentaire.
                  </li>
                </ul>
              </div>
            </section>
          </div>

          <section className="rounded-[32px] border border-white/10 bg-slate-950/40 p-1 shadow-[0_35px_120px_rgba(1,0,8,0.9)] lg:max-h-[calc(100vh-2rem)] lg:overflow-hidden">
            <div className="rounded-[30px] border border-white/10 bg-white/95 text-zinc-900 h-full">
              <AgentPlayground />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}