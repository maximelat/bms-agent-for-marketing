import { AgentPlayground } from "@/components/AgentPlayground";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#04030a] via-[#0d0a16] to-[#05030a] py-12 text-white">
      <div className="pointer-events-none absolute inset-x-[10%] top-10 h-64 rounded-full bg-gradient-to-r from-[#eb54c7]/40 via-[#7c3aed]/30 to-[#2dd4bf]/30 blur-[140px]" />
      <main className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6">
        <header className="space-y-5 text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.4em] text-pink-300/90">Bienvenue · Entretien Copilot BMS</p>
          <h1 className="text-4xl font-semibold text-white">Votre échange guidé pour cartographier les besoins agents</h1>
          <p className="max-w-3xl text-lg text-slate-200">
            Helios vous accompagne pendant 20 minutes pour identifier les irritants de votre quotidien, les données manipulées
            et les opportunités d’agents Copilot M365. Suivez la conversation, relisez la transcription si besoin et validez le
            rapport à la fin : tout est formaté automatiquement pour les équipes produit.
          </p>
        </header>

        <section className="grid gap-5 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(2,2,10,0.65)] lg:grid-cols-3">
          {[
            {
              title: "Avant l’entretien",
              items: [
                "Préparez 2-3 exemples concrets avec volumes (emails/jour, livrables/semaine, temps passé…).",
                "Repérez les sources de données majeures (SharePoint, Teams, outils métier) et leur propriétaire.",
              ],
            },
            {
              title: "Pendant",
              items: [
                "Helios V1 (chat) ou Helios V2 (chat aligné sur le questionnaire) vous guide question par question.",
                "Chaque réponse alimente une transcription et une fiche StructuredNeed en direct.",
              ],
            },
            {
              title: "Après",
              items: [
                "Un rapport normalisé (JSON + matrice Strategic Fit) est généré automatiquement.",
                "Vous recevez un email/n8n et pouvez partager la transcription complète.",
              ],
            },
          ].map((card) => (
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
              Ton consultant, une question à la fois. Idéal pour les entretiens live : Helios reformule, challenge les ordres de
              grandeur et rappelle la section active.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-200 marker:text-emerald-300">
              <li>Conversation rapide (modèle nano/mini).</li>
              <li>Transcription copiée depuis le panneau de droite.</li>
              <li>Rapport final validé lors de la phase “normalisation”.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wide text-emerald-200">Mode questionnaire</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Helios v2</h2>
            <p className="mt-2 text-sm text-slate-200">
              Même logique mais calée sur la trame Google Forms. Pratique lorsque vous souhaitez avancer section par section
              (persona, irritants, données, strategic fit).
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-200 marker:text-emerald-300">
              <li>Affichage de la transcription complète pour revenir en arrière.</li>
              <li>Résumé prêt à être envoyé vers n8n ou exporté.</li>
              <li>Possibilité de compléter ensuite via le formulaire `/questionnaire`.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wide text-emerald-200">Mode audio</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Realtime + transcription</h2>
            <p className="mt-2 text-sm text-slate-200">
              Session WebRTC (voix + texte) : la transcription est enregistrée et, à la coupure, un rapport complet est généré
              automatiquement dans le même format StructuredNeed.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-200 marker:text-emerald-300">
              <li>Interface audio dédiée : <Link href="/realtime" className="text-pink-300 underline">Mode Realtime</Link>.</li>
              <li>Prévoir un casque + navigateur autorisant le micro.</li>
              <li>Rapport exportable (JSON) dès que vous cliquez sur “Couper”.</li>
            </ul>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-slate-950/40 p-1 shadow-[0_35px_120px_rgba(1,0,8,0.9)]">
          <div className="rounded-[30px] border border-white/10 bg-white/95 text-zinc-900">
            <AgentPlayground />
          </div>
        </section>
      </main>
    </div>
  );
}
